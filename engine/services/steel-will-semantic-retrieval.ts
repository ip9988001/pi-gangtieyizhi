/**
 * 钢铁意志·PI版 - 语义检索核心引擎 (Embedding Service)
 * 
 * 正式包名：15 -【钢铁意志·PI版】- 神经反射弧与执行前预加载总线
 * 通俗功能：它负责将记忆文本向量化，并提供语义相似度检索能力
 * 技术别名：Steel Will Semantic Retrieval Service
 * 
 * 架构设计：
 * - 单例模式：确保模型在生命周期内只加载一次
 * - 本地化：完全基于宿主机CPU运行，不依赖外部API
 * - 异步向量化：不阻塞主线程，后台完成向量化任务
 */

import { pipeline, Pipeline } from '@xenova/transformers';
import { LocalIndex } from 'vectra';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

// ============================================================
// 类型定义
// ============================================================

/**
 * 记忆条目的元数据
 */
export interface MemoryMetadata {
  /** 文件路径（如 2026-06-03.md） */
  filePath: string;
  /** 记忆类型（l1/l2/l3） */
  memoryType: 'l1' | 'l2' | 'l3';
  /** 创建时间 */
  createdAt: string;
  /** 标签（可选） */
  tags?: string[];
  /** 其他自定义元数据 */
  [key: string]: any;
}

/**
 * 检索结果
 */
export interface SearchResult {
  /** 相似度分数 (0-1) */
  score: number;
  /** 原始文本 */
  text: string;
  /** 元数据 */
  metadata: MemoryMetadata;
}

/**
 * 服务状态
 */
export interface ServiceStatus {
  /** 是否已初始化 */
  initialized: boolean;
  /** 模型是否已加载 */
  modelLoaded: boolean;
  /** 向量数据库是否已创建 */
  indexCreated: boolean;
  /** 向量数据库中的条目数 */
  itemCount: number;
}

// ============================================================
// 常量定义
// ============================================================

/** 模型名称 */
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

/** 向量维度（all-MiniLM-L6-v2 输出 384 维） */
const VECTOR_DIMENSION = 384;

/** 数据库路径 */
const HOME_DIR = homedir();
const VECTOR_DB_PATH = join(HOME_DIR, '.pi', 'agent', 'memory', 'system', 'vector_db');

const MEMORY_DIR = join(HOME_DIR, '.pi', 'agent', 'memory');
const TEMPORAL_PATH = join(MEMORY_DIR, 'system', 'temporal.json');

/** 日志前缀 */
const LOG_PREFIX = '[SteelWill-SemanticRetrieval]';

type MemoryBucket =
  | 'wiki-entity'
  | 'wiki-concept'
  | 'wiki-source'
  | 'wiki-synthesis'
  | 'l1-index'
  | 'l1'
  | 'l2'
  | 'l3-lesson'
  | 'l3-case'
  | 'l3-pattern'
  | 'l3-anti-pattern'
  | 'l3-reflection'
  | 'l3-procedure'
  | 'l3-other'
  | 'other';

type RankedSearchResult = SearchResult & {
  adjustedScore: number;
  bucket: MemoryBucket;
};

function normalizeTextForDedup(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

function chunkText(text: string, threshold: number = 2000): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  if (normalized.length <= threshold) {
    return [normalized];
  }

  const chunks: string[] = [];
  const paragraphs = normalized.split(/\n\s*\n/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) {
      continue;
    }

    if (currentChunk && currentChunk.length + trimmedParagraph.length + 2 > threshold) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }

    if (trimmedParagraph.length > threshold) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      let remaining = trimmedParagraph;
      while (remaining.length > 0) {
        chunks.push(remaining.substring(0, threshold));
        remaining = remaining.substring(threshold);
      }
      continue;
    }

    currentChunk += `${currentChunk ? '\n\n' : ''}${trimmedParagraph}`;
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function inferMemoryBucket(filePath: string): MemoryBucket {
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

  if (normalizedPath.includes('/memory/wiki/entities/')) {
    return 'wiki-entity';
  }

  if (normalizedPath.includes('/memory/wiki/concepts/')) {
    return 'wiki-concept';
  }

  if (normalizedPath.includes('/memory/wiki/sources/')) {
    return 'wiki-source';
  }

  if (normalizedPath.includes('/memory/wiki/synthesis/')) {
    return 'wiki-synthesis';
  }

  if (normalizedPath.includes('/memory/l1/')) {
    return normalizedPath.includes('-index.md') ? 'l1-index' : 'l1';
  }

  if (normalizedPath.includes('/memory/candidates/')) {
    return 'l2';
  }

  if (normalizedPath.includes('/memory/agent/procedures/')) {
    return 'l3-procedure';
  }

  if (normalizedPath.includes('/memory/agent/lessons/')) {
    return 'l3-lesson';
  }

  if (normalizedPath.includes('/memory/agent/cases/')) {
    return 'l3-case';
  }

  if (normalizedPath.includes('/memory/agent/patterns/')) {
    return 'l3-pattern';
  }

  if (normalizedPath.includes('/memory/agent/anti-patterns/')) {
    return 'l3-anti-pattern';
  }

  if (normalizedPath.includes('/memory/agent/reflections/')) {
    return 'l3-reflection';
  }

  if (normalizedPath.includes('/memory/agent/')) {
    return 'l3-other';
  }

  return 'other';
}

function getBucketWeight(bucket: MemoryBucket): number {
  switch (bucket) {
    case 'wiki-synthesis':
      return 1.28;
    case 'wiki-concept':
    case 'wiki-entity':
      return 1.22;
    case 'wiki-source':
      return 1.16;
    case 'l3-procedure':
      // 程序性记忆（怎么做事的步骤）权重最高：可直接复用于下一次同类任务
      return 1.35;
    case 'l3-lesson':
    case 'l3-case':
    case 'l3-pattern':
    case 'l3-anti-pattern':
      return 1.2;
    case 'l3-reflection':
    case 'l3-other':
      return 1.1;
    case 'l2':
      return 1.02;
    case 'l1-index':
      return 0.5;
    case 'l1':
      return 0.42;
    case 'other':
    default:
      return 1;
  }
}

// ============================================================
// 使用账本（记忆新陈代谢的基础）
//   记录每条记忆被召回的次数与最后时间，供「冷宫/热点」衰减规则使用。
//   这同时是「误召回账本」的原料：长期被召回却从不被采纳的条目会暴露出来。
// ============================================================
const USAGE_PATH = join(MEMORY_DIR, 'system', 'usage.json');

interface UsageEntry { count: number; lastUsed: string; firstSeen: string; }

function loadUsage(): Record<string, UsageEntry> {
  try {
    if (!existsSync(USAGE_PATH)) return {};
    return JSON.parse(readFileSync(USAGE_PATH, 'utf-8')) as Record<string, UsageEntry>;
  } catch { return {}; }
}

/**
 * 记录本次召回。采用「读-改-写 + 节流落盘」：
 * 高频检索下每次都写盘代价高，故用内存缓冲 + 定时刷。
 */
let _usageBuf: Record<string, UsageEntry> | null = null;
let _usageDirty = false;
let _usageFlushTimer: ReturnType<typeof setInterval> | null = null;

function recordUsage(paths: string[]): void {
  try {
    if (_usageBuf === null) _usageBuf = loadUsage();
    const now = new Date().toISOString();
    for (const p of paths) {
      const k = temporalKey(p);
      const e = _usageBuf[k];
      if (e) { e.count += 1; e.lastUsed = now; }
      else { _usageBuf[k] = { count: 1, lastUsed: now, firstSeen: now }; }
    }
    _usageDirty = true;
    // 首次调用时挂一个 unref 的定时刷盘（unref 保证不阻塞进程退出）
    if (!_usageFlushTimer) {
      _usageFlushTimer = setInterval(() => flushUsage(), 10000);
      if (typeof (_usageFlushTimer as any).unref === 'function') (_usageFlushTimer as any).unref();
    }
  } catch { /* 账本失败绝不影响检索 */ }
}

function flushUsage(): void {
  if (!_usageDirty || !_usageBuf) return;
  try {
    if (!existsSync(MEMORY_DIR + '/system')) mkdirSync(MEMORY_DIR + '/system', { recursive: true });
    const tmp = USAGE_PATH + '.tmp';
    writeFileSync(tmp, JSON.stringify(_usageBuf, null, 2), 'utf-8');
    // 用 rename 保证原子性
    try { (require('fs') as any).renameSync(tmp, USAGE_PATH); }
    catch { writeFileSync(USAGE_PATH, JSON.stringify(_usageBuf, null, 2), 'utf-8'); }
    _usageDirty = false;
  } catch { /* ignore */ }
}


// ============================================================
// 多信号融合：词法匹配（中文用字符二元组）
//   原设计只有语义一路。all-MiniLM-L6-v2 的中文语义能力弱，
//   实测「把脚本做成开机自启并且每天定时跑一次」无法召回
//   「systemd服务化常驻与定时任务」。故引入第二路词法信号做融合。
//   思路来自 mem0 的 multi-signal retrieval（semantic + BM25 + entity 并行打分后融合）。
// ============================================================

/** 取字符串的字符二元组集合（中文无词边界，二元组是最稳的粗粒度词法特征） */
function charBigrams(s: string): Set<string> {
  const t = (s || '').toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');
  const out = new Set<string>();
  for (let i = 0; i + 1 < t.length; i++) out.add(t.slice(i, i + 2));
  return out;
}

/** 查询的二元组被文档覆盖的比例（0~1）。文档很长时按覆盖率算，对短查询友好 */
function lexicalOverlap(query: string, doc: string): number {
  const q = charBigrams(query);
  if (!q.size) return 0;
  const d = charBigrams(doc);
  if (!d.size) return 0;
  let hit = 0;
  for (const g of q) if (d.has(g)) hit++;
  return hit / q.size;
}

/** 词法信号的融合强度。1.8 = 词法完全命中时最高可把分数放大到 2.8 倍 */
const LEXICAL_ALPHA = 1.8;


// ============================================================
// 时间维度：事实有效期窗口（概念取自 Graphiti 的 temporal knowledge graph）
//   - 本实现不引入图数据库，用 sidecar JSON 记录，检索时按权重压制
//   - memory/system/temporal.json 结构：
//       { "<filePath>": { valid_from, valid_until, superseded_by, superseded_at, confidence } }
// ============================================================

/** 已被取代的条目权重（强压制，但不删除，保留历史可查） */
const PENALTY_SUPERSEDED = 0.25;
/** 已过有效期但仍未被取代的条目权重 */
const PENALTY_EXPIRED = 0.5;

interface TemporalMeta {
  valid_from?: string;
  valid_until?: string;
  superseded_by?: string;
  superseded_at?: string;
  confidence?: number;
}

/** 把绝对路径规范成 temporal.json 使用的键（"memory/..." 形式） */
function temporalKey(p: string): string {
  const s = (p || '').replace(/\\/g, '/');
  const marker = '/memory/';
  const i = s.indexOf(marker);
  if (i >= 0) return s.slice(i + 1);
  return s.startsWith('memory/') ? s : s;
}

function loadTemporalIndex(): Record<string, TemporalMeta> {
  try {
    if (!existsSync(TEMPORAL_PATH)) return {};
    return JSON.parse(readFileSync(TEMPORAL_PATH, 'utf-8')) as Record<string, TemporalMeta>;
  } catch (e) {
    console.warn(`${LOG_PREFIX} temporal.json 读取失败，本次不做时间压制:`, e);
    return {};
  }
}

/** 按时间维度调整分数，并返回人类可读的说明 */
function applyTemporalWeight(
  filePath: string,
  score: number,
  idx: Record<string, TemporalMeta>,
): { score: number; note: string } {
  const t = idx[temporalKey(filePath)];
  if (!t) return { score, note: '' };

  let mult = 1;
  const notes: string[] = [];

  if (t.superseded_by) {
    mult *= PENALTY_SUPERSEDED;
    const short = t.superseded_by.split('/').pop() ?? t.superseded_by;
    notes.push(`已被取代→${short}`);
  }
  if (t.valid_until) {
    const ts = Date.parse(t.valid_until);
    if (!Number.isNaN(ts) && ts < Date.now()) {
      mult *= PENALTY_EXPIRED;
      notes.push(`已过期(${t.valid_until.slice(0, 10)})`);
    }
  }
  if (typeof t.confidence === 'number') {
    mult *= Math.max(0.1, Math.min(1, t.confidence));
    if (t.confidence < 1) notes.push(`置信度${t.confidence}`);
  }

  return { score: score * mult, note: notes.join('; ') };
}


function rerankAndDeduplicateResults(results: SearchResult[], topK: number): SearchResult[] {
  const seenExact = new Set<string>();
  const perFileCount = new Map<string, number>();
  const ranked: RankedSearchResult[] = [];

  for (const result of results) {
    const normalizedText = normalizeTextForDedup(result.text);
    if (!normalizedText) {
      continue;
    }

    const exactKey = `${result.metadata.filePath}::${normalizedText}`;
    if (seenExact.has(exactKey)) {
      continue;
    }
    seenExact.add(exactKey);

    const bucket = inferMemoryBucket(result.metadata.filePath);
    const bucketWeight = getBucketWeight(bucket);
    const existingCount = perFileCount.get(result.metadata.filePath) ?? 0;
    const sameFilePenalty = existingCount === 0 ? 1 : Math.max(0.78, 1 - existingCount * 0.12);
    perFileCount.set(result.metadata.filePath, existingCount + 1);

    ranked.push({
      ...result,
      bucket,
      adjustedScore: result.score * bucketWeight * sameFilePenalty,
    });
  }

  ranked.sort((a, b) => {
    if (b.adjustedScore !== a.adjustedScore) {
      return b.adjustedScore - a.adjustedScore;
    }
    return b.score - a.score;
  });

  // ---- 非 L1 优先规则 ----
  // L1 是逐轮对话原文（原始料），只应作为兜底，不应抢占正式结论层
  // （wiki / L3 / L2）的召回名额。只要非 L1 候选足够 topK 条，就把 L1 全部挤出去。
  const isL1Bucket = (b: MemoryBucket) => b === 'l1' || b === 'l1-index';
  const nonL1 = ranked.filter((r) => !isL1Bucket(r.bucket));
  const pool = nonL1.length >= topK ? nonL1 : ranked;

  return pool
    .slice(0, topK)
    .map(({ adjustedScore: _adjustedScore, bucket: _bucket, ...result }) => result);
}

// ============================================================
// SemanticRetrievalService 类（单例）
// ============================================================

class SemanticRetrievalService {
  /** 特征提取管道 */
  private featureExtractor: Pipeline | null = null;

  /** Vectra 本地向量索引 */
  private index: LocalIndex | null = null;

  /** 是否已初始化 */
  private initialized: boolean = false;

  /** 模型是否正在加载中 */
  private loading: boolean = false;

  /** 初始化队列（防止并发初始化） */
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化语义检索服务
   * 
   * 核心逻辑：
   * 1. 加载 Xenova/all-MiniLM-L6-v2 特征提取模型
   * 2. 检查 Vectra 索引是否存在，若无则初始化
   * 3. 单例缓存，确保模型在生命周期内只加载一次
   */
  async init(): Promise<void> {
    // 如果已经初始化，直接返回
    if (this.initialized) {
      console.log(`${LOG_PREFIX} 服务已初始化，跳过重复初始化`);
      return;
    }

    // 如果正在初始化中，等待初始化完成
    if (this.initPromise) {
      console.log(`${LOG_PREFIX} 初始化进行中，等待完成...`);
      await this.initPromise;
      return;
    }

    // 开始初始化
    this.initPromise = this._doInit();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * 实际的初始化逻辑
   */
  private async _doInit(): Promise<void> {
    console.log(`${LOG_PREFIX} 开始初始化语义检索服务...`);

    try {
      // 第一步：加载特征提取模型
      await this._loadModel();

      // 第二步：初始化向量数据库索引
      await this._initIndex();

      this.initialized = true;
      console.log(`${LOG_PREFIX} ✅ 语义检索服务初始化完成`);

    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ 初始化失败:`, error);
      throw error;
    }
  }

  /**
   * 加载特征提取模型
   * 
   * 注意：首次运行时会自动下载模型（约80MB）到本地缓存
   */
  private async _loadModel(): Promise<void> {
    if (this.featureExtractor) {
      console.log(`${LOG_PREFIX} 模型已加载，跳过`);
      return;
    }

    console.log(`${LOG_PREFIX} 正在加载特征提取模型: ${MODEL_NAME}...`);
    console.log(`${LOG_PREFIX} 首次运行可能需要下载模型，请耐心等待...`);

    this.loading = true;

    try {
      // 使用 pipeline 创建特征提取管道
      this.featureExtractor = await pipeline('feature-extraction', MODEL_NAME, {
        // 使用本地缓存，避免重复下载
        cache_dir: join(HOME_DIR, '.cache', 'huggingface', 'transformers'),
        // 量化模型以减少内存占用
        quantized: true,
      });

      console.log(`${LOG_PREFIX} ✅ 模型加载成功`);

    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ 模型加载失败:`, error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  /**
   * 初始化向量数据库索引
   */
  private async _initIndex(): Promise<void> {
    console.log(`${LOG_PREFIX} 正在初始化向量数据库索引...`);
    console.log(`${LOG_PREFIX} 索引路径: ${VECTOR_DB_PATH}`);

    try {
      // 确保目录存在
      if (!existsSync(VECTOR_DB_PATH)) {
        mkdirSync(VECTOR_DB_PATH, { recursive: true });
        console.log(`${LOG_PREFIX} 创建向量数据库目录: ${VECTOR_DB_PATH}`);
      }

      // 创建 LocalIndex 实例
      this.index = new LocalIndex(VECTOR_DB_PATH);

      // 检查索引是否已存在
      const indexExists = await this.index.isIndexCreated();

      if (!indexExists) {
        console.log(`${LOG_PREFIX} 索引不存在，正在创建新索引...`);
        
        // 创建索引，指定版本和元数据配置
        await this.index.createIndex({
          version: 1,
          metadata_config: {
            indexed: ['memoryType', 'filePath'], // 为这些字段创建索引以加速过滤
          },
        });

        console.log(`${LOG_PREFIX} ✅ 向量索引创建成功`);
      } else {
        console.log(`${LOG_PREFIX} ✅ 向量索引已存在，直接使用`);
      }

    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ 向量索引初始化失败:`, error);
      throw error;
    }
  }

  /**
   * 将文本转换为向量
   * 
   * @param text 要转换的文本
   * @returns Float32Array 格式的向量
   */
  private async _textToVector(text: string): Promise<Float32Array> {
    if (!this.featureExtractor) {
      throw new Error('模型未加载，请先调用 init()');
    }

    try {
      // 使用模型提取特征
      const output = await this.featureExtractor(text, {
        pooling: 'mean', // 使用平均池化
        normalize: true,  // 归一化向量
      });

      // 提取向量数据
      // output.data 是 Float32Array，形状为 [1, 384]
      // 我们需要提取出 384 维的向量
      const vector = output.data as Float32Array;

      // 验证向量维度
      if (vector.length !== VECTOR_DIMENSION) {
        console.warn(`${LOG_PREFIX} 警告: 向量维度不匹配，期望 ${VECTOR_DIMENSION}，实际 ${vector.length}`);
      }

      return vector;

    } catch (error) {
      console.error(`${LOG_PREFIX} 文本转向量失败:`, error);
      throw error;
    }
  }

  /**
   * 添加记忆到向量数据库
   * 
   * @param text 记忆文本内容
   * @param metadata 元数据（必须包含 filePath）
   * @returns 插入的条目
   */
  async addMemory(text: string, metadata: MemoryMetadata): Promise<void> {
    // 确保已初始化
    if (!this.initialized) {
      await this.init();
    }

    if (!this.index) {
      throw new Error('向量索引未初始化');
    }

    console.log(`${LOG_PREFIX} 正在添加记忆到向量数据库...`);
    console.log(`${LOG_PREFIX} 文件路径: ${metadata.filePath}`);
    console.log(`${LOG_PREFIX} 文本长度: ${text.length} 字符`);

    try {
      // 将文本转换为向量
      console.log(`${LOG_PREFIX} 正在将文本转换为向量...`);
      const vector = await this._textToVector(text);

      // 生成唯一ID（使用文件路径 + 时间戳）
      const itemId = `${metadata.filePath}_${Date.now()}`;

      // 开始更新索引
      await this.index.beginUpdate();

      // 插入条目
      await this.index.upsertItem({
        id: itemId,
        vector: Array.from(vector), // vectra 需要 number[] 类型
        metadata: {
          ...metadata,
          text: text, // 将原始文本也存入元数据
          textLength: text.length,
          addedAt: new Date().toISOString(),
        },
      });

      // 结束更新，保存到磁盘
      await this.index.endUpdate();

      console.log(`${LOG_PREFIX} ✅ 记忆添加成功，ID: ${itemId}`);

    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ 添加记忆失败:`, error);
      // 尝试取消更新
      if (this.index) {
        this.index.cancelUpdate();
      }
      throw error;
    }
  }

  async deleteMemoriesByFilePath(filePath: string): Promise<number> {
    if (!this.initialized) {
      await this.init();
    }

    if (!this.index) {
      throw new Error('鍚戦噺绱㈠紩鏈垵濮嬪寲');
    }

    const items = await this.index.listItemsByMetadata({ filePath });
    if (!items || items.length === 0) {
      return 0;
    }

    await this.index.beginUpdate();
    try {
      const ids = items.map((item: any) => item.id).filter(Boolean);
      if (ids.length > 0) {
        await this.index.deleteItems(ids);
      }
      await this.index.endUpdate();
      console.log(`${LOG_PREFIX} deleted ${ids.length} vector items for ${filePath}`);
      return ids.length;
    } catch (error) {
      this.index.cancelUpdate();
      throw error;
    }
  }

  async syncDocument(
    text: string,
    metadata: MemoryMetadata,
    options?: { chunkThreshold?: number },
  ): Promise<{ deleted: number; inserted: number }> {
    if (!text.trim()) {
      throw new Error('Cannot sync an empty document into the vector index');
    }

    if (!this.initialized) {
      await this.init();
    }

    if (!this.index) {
      throw new Error('鍚戦噺绱㈠紩鏈垵濮嬪寲');
    }

    const deleted = await this.deleteMemoriesByFilePath(metadata.filePath);
    const chunks = chunkText(text, options?.chunkThreshold ?? 2000);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await this.addMemory(chunk, {
        ...metadata,
        tags: [...(metadata.tags ?? []), `chunk-${i + 1}-of-${chunks.length}`],
      });
    }

    return {
      deleted,
      inserted: chunks.length,
    };
  }

  /**
   * 语义检索记忆
   * 
   * @param query 查询文本
   * @param topK 返回最相似的 K 条记录，默认为 3
   * @returns 检索结果数组
   */
  async searchMemory(query: string, topK: number = 3): Promise<SearchResult[]> {
    // 确保已初始化
    if (!this.initialized) {
      await this.init();
    }

    if (!this.index) {
      throw new Error('向量索引未初始化');
    }

    console.log(`${LOG_PREFIX} 正在执行语义检索...`);
    console.log(`${LOG_PREFIX} 查询: "${query}"`);
    console.log(`${LOG_PREFIX} TopK: ${topK}`);

    try {
      // 将查询文本转换为向量
      console.log(`${LOG_PREFIX} 正在将查询转换为向量...`);
      const queryVector = await this._textToVector(query);

      // 在向量数据库中查询最相似的条目
      console.log(`${LOG_PREFIX} 正在向量数据库中搜索...`);
      // 过取候选：先多取一批再重排。
      // 若只取 topK 条，L1 会凭数量优势把名额占满（L1 占索引 58%），
      // 高分的 wiki / L3 条目根本进不了重排池，权重再准也无效。
      // 语料规模小（百量级），候选池代价近乎为零：直接取一个足够大的池子，
      // 让「桶权重 + 非 L1 优先」这两层重排真正发挥作用。
      // 过小的池子会让高权重条目根本没资格进入重排。
      const fetchCount = Math.max(topK * 40, 300);
      console.log(`${LOG_PREFIX} 过取候选数: ${fetchCount}（目标 topK=${topK}）`);
      const results = await this.index.queryItems(
        Array.from(queryVector),
        query,
        fetchCount
      );

      // 转换结果格式
      // 时间维度压制：被取代/过期的条目降权（不删除，历史仍可查）
      const temporalIdx = loadTemporalIndex();

      const rawSearchResults: SearchResult[] = results.map((result) => ({
        score: result.score,
        text: (result.item.metadata as any).text || '',
        metadata: {
          filePath: (result.item.metadata as any).filePath,
          memoryType: (result.item.metadata as any).memoryType,
          createdAt: (result.item.metadata as any).createdAt,
          tags: (result.item.metadata as any).tags,
          bucket: inferMemoryBucket((result.item.metadata as any).filePath),
        } as MemoryMetadata,
      }));

      // 多信号融合：语义分 × (1 + α·词法覆盖率)
      // 目的：补救嵌入模型中文语义弱的短板（实测「开机自启/定时」无法召回「常驻/定时任务」）
      let lexBoosted = 0;
      for (const r of rawSearchResults) {
        const lex = lexicalOverlap(query, r.text || '');
        if (lex > 0) {
          r.score = r.score * (1 + LEXICAL_ALPHA * lex);
          lexBoosted++;
        }
      }
      if (lexBoosted) {
        console.log(`${LOG_PREFIX} 词法融合：${lexBoosted}/${rawSearchResults.length} 条命中词法信号`);
      }

      // 应用时间权重
      for (const r of rawSearchResults) {
        const { score, note } = applyTemporalWeight(r.metadata.filePath, r.score, temporalIdx);
        r.score = score;
        if (note) (r.metadata as any).temporal = note;
      }

      const searchResults = rerankAndDeduplicateResults(rawSearchResults, topK);

      // 记账（记忆新陈代谢的原料；失败绝不影响检索）
      recordUsage(searchResults.map((r) => r.metadata.filePath));

      console.log(`${LOG_PREFIX} ✅ 检索完成，找到 ${searchResults.length} 条结果`);

      // 打印检索结果摘要
      searchResults.forEach((result, index) => {
        const tnote = (result.metadata as any).temporal ? ` | ⏳${(result.metadata as any).temporal}` : '';
        console.log(`${LOG_PREFIX}   [${index + 1}] 相似度: ${result.score.toFixed(4)} | 文件: ${result.metadata.filePath}${tnote}`);
      });

      return searchResults;

    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ 检索失败:`, error);
      throw error;
    }
  }

  /**
   * 获取服务状态
   * 
   * @returns 服务状态对象
   */
  async getStatus(): Promise<ServiceStatus> {
    const status: ServiceStatus = {
      initialized: this.initialized,
      modelLoaded: this.featureExtractor !== null,
      indexCreated: false,
      itemCount: 0,
    };

    try {
      if (this.index) {
        status.indexCreated = await this.index.isIndexCreated();
        if (status.indexCreated) {
          const stats = await this.index.getIndexStats();
          status.itemCount = stats.items;
        }
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} 获取状态失败:`, error);
    }

    return status;
  }

  /**
   * 获取索引统计信息
   */
  async getIndexStats(): Promise<{ items: number; dimensions: number } | null> {
    if (!this.index) {
      return null;
    }

    try {
      const stats = await this.index.getIndexStats();
      return {
        items: stats.items,
        dimensions: VECTOR_DIMENSION,
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} 获取索引统计失败:`, error);
      return null;
    }
  }
}

// ============================================================
// 导出单例
// ============================================================

/** 语义检索服务单例实例 */
const semanticRetrievalService = new SemanticRetrievalService();

export default semanticRetrievalService;

// ============================================================
// 便捷导出（用于直接调用）
// ============================================================

/**
 * 初始化语义检索服务
 */
export async function initSemanticRetrieval(): Promise<void> {
  return semanticRetrievalService.init();
}

/**
 * 添加记忆到向量数据库
 */
export async function addMemoryToVectorDB(text: string, metadata: MemoryMetadata): Promise<void> {
  return semanticRetrievalService.addMemory(text, metadata);
}

/**
 * 语义检索记忆
 */
export async function searchMemoryByVector(query: string, topK: number = 3): Promise<SearchResult[]> {
  return semanticRetrievalService.searchMemory(query, topK);
}

export async function deleteMemoriesByFilePath(filePath: string): Promise<number> {
  return semanticRetrievalService.deleteMemoriesByFilePath(filePath);
}

export async function syncDocumentToVectorDB(
  text: string,
  metadata: MemoryMetadata,
  options?: { chunkThreshold?: number },
): Promise<{ deleted: number; inserted: number }> {
  return semanticRetrievalService.syncDocument(text, metadata, options);
}

/**
 * 获取服务状态
 */
export async function getSemanticRetrievalStatus(): Promise<ServiceStatus> {
  return semanticRetrievalService.getStatus();
}

// ============================================================
// 类型导出
// ============================================================

export type { SemanticRetrievalService };
