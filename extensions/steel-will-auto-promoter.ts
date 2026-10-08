/**
 * 钢铁意志·PI版 — 自动晋升管道 V2 (Auto-Promoter)
 * 
 * V2 改动:
 *   - session_start 时扫全量 L1 文件 → 提炼 → 删旧（仅每天一次）
 *   - 旧 L1 保留 7 天，超期自动清除
 *   - 会话期间每 5 分钟增量扫今日 L1
 *   - session_end 作为兜底触发
 * 
 * 晋升链路:
 *   1. L1→L2：扫描 L1 日志，提取信号词命中 → 写入候选池
 *   2. L2→L3：检查候选池条目闸门条件，晋升达标者
 *   3. L3→Wiki：同主题 L3 条目 ≥3 个时，合成为 Wiki 综合页
 * 
 * 手动命令：
 *   /promote — 手动触发晋升检查
 *   /promote-status — 查看晋升管道状态
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, basename } from "path";

// 本地日期/时间戳 —— 修复 UTC/CST 错位
// 原用 new Date().toISOString() 取到的是 UTC 日期，在 CST 00:00-08:00 期间
// 会比本地日期少一天，导致 L1 文件定位错位、lastFullExtractionDate 记错。
const localDate = (d: Date = new Date()): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const localStamp = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${localDate()}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

// 单次晋升上限 —— 防止修复正则后批量晋升爆炸（存量 389 条候选）
// 源文件名已含内容 hash，用它当后缀可保证一条候选 = 一个 L3 文件，不再互相覆盖
const MAX_PROMOTE_PER_RUN = 10;

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const L1_DIR = join(MEMORY_DIR, "l1");
const CANDIDATES_DIR = join(MEMORY_DIR, "candidates");
const AGENT_DIR = join(MEMORY_DIR, "agent");
const WIKI_DIR = join(MEMORY_DIR, "wiki");
const SYSTEM_DIR = join(MEMORY_DIR, "system");
const PROMOTER_STATE_FILE = join(SYSTEM_DIR, "auto_promoter_state.json");
const LOG_PREFIX = "[SteelWill-Promoter]";

// ============================================================
// 信号词
// ============================================================

const SIGNAL_WORDS = [
  "记住", "重要", "教训", "规则", "模式", "结论", "方案", "偏好", "习惯",
  "关键", "必须", "永远不要", "总是", "应该", "不要", "禁止", "以后都",
];

// ============================================================
// 状态管理
// ============================================================

interface PromoterState {
  lastFullExtractionDate: string;  // "2026-06-21"
  lastProcessedPositions: Record<string, number>;  // {filepath: byte_position}
  knownFacts: Record<string, { t: string; c: string; d: string }>;
}

function loadPromoterState(): PromoterState {
  try {
    if (existsSync(PROMOTER_STATE_FILE)) {
      return JSON.parse(readFileSync(PROMOTER_STATE_FILE, "utf-8"));
    }
  } catch { /* ignore */ }
  return { lastFullExtractionDate: "", lastProcessedPositions: {}, knownFacts: {} };
}

function savePromoterState(state: PromoterState): void {
  if (!existsSync(SYSTEM_DIR)) mkdirSync(SYSTEM_DIR, { recursive: true });
  // 清理 30 天前的 knownFacts —— 防止状态文件无界膨胀（曾达 165KB / 452 条）
  const cutoff = localDate(new Date(Date.now() - 30 * 86400_000));
  let pruned = 0;
  const facts: any = state.knownFacts ?? {};
  for (const k of Object.keys(facts)) {
    const d = facts[k]?.d;
    if (d && d < cutoff) { delete facts[k]; pruned++; }
  }
  // 硬上限：即便全部落在 30 天窗口内，也按日期保留最新 MAX_KNOWN_FACTS 条。
  // 稳态约 50 条/天 × 30 天 ≈ 1500 条 ≈ 600KB，远超单次会话启动应有的读取量。
  const MAX_KNOWN_FACTS = 800;
  const allKeys = Object.keys(facts);
  if (allKeys.length > MAX_KNOWN_FACTS) {
    allKeys.sort((a, b) => String(facts[a]?.d || "").localeCompare(String(facts[b]?.d || "")));
    for (let i = 0; i < allKeys.length - MAX_KNOWN_FACTS; i++) { delete facts[allKeys[i]]; pruned++; }
  }
  writeFileSync(PROMOTER_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  if (pruned > 0) console.log(`${LOG_PREFIX} 状态清理: 移除 ${pruned} 条过期/超限 knownFacts`);
}

// ============================================================
// L1 文件管理
// ============================================================

/** 获取所有 L1 文件，按日期排序 */
function getAllL1Files(): string[] {
  if (!existsSync(L1_DIR)) return [];
  return readdirSync(L1_DIR)
    .filter(f => f.endsWith(".md"))
    .map(f => join(L1_DIR, f))
    .sort();
}

/** 从文件名提取日期（支持 2026-06-21.md 和 2026-06-21-xxx.md 两种格式） */
function extractDateFromFilename(filePath: string): string | null {
  const name = basename(filePath, ".md");
  const match = name.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/** 删除超过 7 天的 L1 文件 */
function cleanupOldL1Files(): number {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let deleted = 0;

  const files = getAllL1Files();
  for (const fp of files) {
    const dateStr = extractDateFromFilename(fp);
    if (!dateStr) continue;
    const fileDate = new Date(dateStr);
    if (fileDate < cutoff) {
      try {
        unlinkSync(fp);
        deleted++;
        console.log(`${LOG_PREFIX} 删除过期 L1: ${basename(fp)}`);
      } catch (e: any) {
        console.error(`${LOG_PREFIX} 删除失败: ${basename(fp)} - ${e.message}`);
      }
    }
  }
  return deleted;
}

// ============================================================
// L1→L2：从 L1 日志提取候选
// ============================================================

interface ExtractedFact {
  text: string;
  category: "preference" | "lesson" | "pattern" | "decision" | "fact";
  signalWord: string;
  sourceFile: string;
}

function extractFactsFromL1File(filePath: string, knownFacts: Record<string, any>): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch { return facts; }

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const sw of SIGNAL_WORDS) {
      if (line.includes(sw)) {
        const context = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2))
          .join(" ")
          .replace(/^[#\-\*\s]+/, "")
          .trim()
          .slice(0, 300);

        if (context.length > 10) {
          const category = categorizeFact(sw);
          const hash = require("crypto").createHash("sha256")
            .update(context.slice(0, 50)).digest("hex").slice(0, 12);

          // 去重：已知事实中不存在
          if (!knownFacts[hash]) {
            facts.push({ text: context, category, signalWord: sw, sourceFile: basename(filePath) });
            knownFacts[hash] = { t: context, c: category, d: localDate() };
          }
        }
        break;
      }
    }
  }

  // 二次去重：相似文本
  const seen = new Set<string>();
  return facts.filter(f => {
    const key = f.text.slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function categorizeFact(signalWord: string): ExtractedFact["category"] {
  if (["偏好", "习惯"].includes(signalWord)) return "preference";
  if (["教训", "永远不要", "禁止"].includes(signalWord)) return "lesson";
  if (["模式", "方案"].includes(signalWord)) return "pattern";
  if (["决定", "结论"].includes(signalWord)) return "decision";
  return "fact";
}

function writeCandidate(fact: ExtractedFact, dateStr: string): string | null {
  try {
    const domain = fact.category === "preference" ? "user" : "agent";
    const domainDir = join(CANDIDATES_DIR, domain);
    if (!existsSync(domainDir)) mkdirSync(domainDir, { recursive: true });

    const hash = require("crypto").createHash("sha256")
      .update(fact.text).digest("hex").slice(0, 8);
    const fileName = `${dateStr}-${fact.category}-${hash}.md`;
    const filePath = join(domainDir, fileName);

    // 去重
    if (existsSync(domainDir)) {
      const existing = readdirSync(domainDir).filter(f => f.endsWith(".md"));
      for (const f of existing) {
        try {
          const c = readFileSync(join(domainDir, f), "utf-8");
          if (c.includes(fact.text.slice(0, 30))) return null;
        } catch { /* skip */ }
      }
    }

    const now = localStamp();
    const content = `# [候选] ${fact.text.slice(0, 80)}

## 来源
- **日期**: ${dateStr}
- **来源文件**: ${fact.sourceFile}
- **触发词**: ${fact.signalWord}

## 内容
${fact.text}

## 状态
- **状态**: candidate
- **更新时间**: ${now}

## 标签
- **域**: ${domain}
- **类型**: ${fact.category}
- **置信度**: 0.5（待验证）
`;

    writeFileSync(filePath, content, "utf-8");
    return filePath;
  } catch (e: any) {
    console.error(`${LOG_PREFIX} 写入候选失败:`, e.message);
    return null;
  }
}

// ============================================================
// L2→L3：检查候选池晋升条件
// ============================================================

interface CandidateInfo {
  filePath: string;
  state: string;
  domain: string;
  category: string;
  content: string;
  dateStr: string;
}

function scanCandidates(): CandidateInfo[] {
  const results: CandidateInfo[] = [];
  for (const domain of ["user", "agent"]) {
    const dir = join(CANDIDATES_DIR, domain);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter(f => f.endsWith(".md"))) {
      const fp = join(dir, file);
      try {
        const content = readFileSync(fp, "utf-8");
        // 宽松匹配：兼容半角/全角冒号、可选的 ** 加粗、中文类目
        const stateMatch = content.match(/状态\**\s*[:：]\s*([^\n*]+)/);
        const catMatch = content.match(/类型\**\s*[:：]\s*([^\n*]+)/);
        const dateMatch = content.match(/日期\**\s*[:：]\s*([\d-]+)/);
        results.push({
          filePath: fp,
          state: stateMatch?.[1]?.trim() ?? "candidate",
          domain,
          category: catMatch?.[1]?.trim() ?? "未知",
          content,
          dateStr: dateMatch?.[1]?.trim() ?? "",
        });
      } catch { /* skip */ }
    }
  }
  return results;
}

function promoteCandidate(c: CandidateInfo): string | null {
  if (c.state === "promoted" || c.state === "rejected") return null;
  if (c.state !== "promotable" && c.state !== "candidate") return null;

  const hasEvidence = c.content.length > 200;

  const l3DirMap: Record<string, string> = {
    preference: join(AGENT_DIR, "decisions"),
    lesson: join(AGENT_DIR, "lessons"),
    pattern: join(AGENT_DIR, "patterns"),
    decision: join(AGENT_DIR, "decisions"),
    fact: join(AGENT_DIR, "cases"),
  };
  const l3Dir = l3DirMap[c.category] ?? join(AGENT_DIR, "cases");
  if (!existsSync(l3Dir)) mkdirSync(l3Dir, { recursive: true });

  // 文件名唯一化：用候选原文件名（已含 hash）作后缀
  // 原先 `promoted-${dateStr}-${category}.md` 会让同日期同类别的候选互相覆盖
  const fileName = `promoted-${basename(c.filePath)}`;
  const l3Path = join(l3Dir, fileName);
  const l3Content = c.content
    .replace(/(状态\s*\**\s*[:：]\s*)candidate/, (_m: string, p1: string) => p1 + "active")
    .replace(/(状态\s*\**\s*[:：]\s*)promotable/, (_m: string, p1: string) => p1 + "active")
    .replace(/(置信度\s*\**\s*[:：]\s*)0\.5/, (_m: string, p1: string) => p1 + "0.7")
    + `\n\n## 晋升记录\n- 晋升时间: ${localStamp()}\n- 来源: 自动晋升管道\n`;

  writeFileSync(l3Path, l3Content, "utf-8");

  const updated = c.content
    .replace(/(状态\s*\**\s*[:：]\s*)candidate/, (_m: string, p1: string) => p1 + "promoted")
    .replace(/(状态\s*\**\s*[:：]\s*)promotable/, (_m: string, p1: string) => p1 + "promoted");
  writeFileSync(c.filePath, updated, "utf-8");

  return l3Path;
}

// ============================================================
// L3→Wiki：同主题合成
// ============================================================

function synthesizeToWiki(): string[] {
  const created: string[] = [];
  const l3Dirs = ["lessons", "cases", "patterns", "decisions"];

  for (const dirName of l3Dirs) {
    const dir = join(AGENT_DIR, dirName);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter(f => f.endsWith(".md"));
    if (files.length < 3) continue;

    const groups: Map<string, string[]> = new Map();
    for (const f of files) {
      try {
        const content = readFileSync(join(dir, f), "utf-8");
        // 宽松匹配：兼容「- **类型**: x」半角/全角/加粗（原先只认全角「- 类型：」，
        // 导致 L3 分类全部解析失败、只能按目录名兜底，auto-synth 页面永远叫 auto-synth-lessons）
        const catMatch = content.match(/类型\**\s*[:：]\s*([^\n*]+)/);
        const category = catMatch?.[1]?.trim() ?? dirName;
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category)!.push(content);
      } catch { /* skip */ }
    }

    for (const [category, contents] of groups) {
      if (contents.length < 3) continue;

      const wikiCat = dirName === "patterns" ? "synthesis" :
                      dirName === "lessons" ? "concepts" : "sources";
      const wikiSubDir = join(WIKI_DIR, wikiCat);
      if (!existsSync(wikiSubDir)) mkdirSync(wikiSubDir, { recursive: true });

      const title = `自动合成：${category}（${contents.length}条L3记忆）`;
      const fileName = `auto-synth-${category}.md`;   // 固定名：每次覆盖，不再累积
      const wikiPath = join(wikiSubDir, fileName);

      const excerpts = contents.map(c => {
        const match = c.match(/## 内容\n([\s\S]*?)(?=\n##|$)/);
        return match?.[1]?.trim().slice(0, 200) ?? c.slice(0, 200);
      });

      const wikiContent = `# ${title}

## Summary
从 L3 ${dirName} 目录自动合成 ${contents.length} 条 ${category} 类记忆。

## Content
${excerpts.map((e, i) => `### 条目 ${i + 1}\n${e}\n`).join("\n")}

## Metadata
- 合成时间: ${localStamp()}
- source_path: auto-synth/L3-${dirName}
- 来源: 自动晋升管道
- 条目数: ${contents.length}
`;

      writeFileSync(wikiPath, wikiContent, "utf-8");
      created.push(wikiPath);
    }
  }
  return created;
}

// ============================================================
// 核心：全量提取 + 增量提取
// ============================================================

/**
 * 处理单个 L1 文件，提取信号词 → 写候选
 * 返回提取的候选数量
 */
function processL1File(filePath: string, dateStr: string, knownFacts: Record<string, any>): number {
  const facts = extractFactsFromL1File(filePath, knownFacts);
  let count = 0;
  for (const fact of facts) {
    if (writeCandidate(fact, dateStr)) count++;
  }
  return count;
}

/**
 * 全量提取：扫描所有 L1 文件（每天启动时执行一次）
 */
function runFullExtraction(state: PromoterState): { l1Count: number; l2Count: number; l3Count: number; wikiCount: number; deleted: number } {
  const today = localDate();

  // 今天已经执行过，跳过
  if (state.lastFullExtractionDate === today) {
    console.log(`${LOG_PREFIX} 今日已完成全量提取，跳过`);
    return { l1Count: 0, l2Count: 0, l3Count: 0, wikiCount: 0, deleted: 0 };
  }

  console.log(`${LOG_PREFIX} === 开始每日全量提取 (${today}) ===`);

  // 1. 扫描所有 L1 文件
  const files = getAllL1Files();
  console.log(`${LOG_PREFIX} 扫描 L1 文件: ${files.length} 个`);

  let totalCandidates = 0;
  for (const fp of files) {
    const fileDate = extractDateFromFilename(fp) ?? today;
    const n = processL1File(fp, fileDate, state.knownFacts);
    if (n > 0) console.log(`${LOG_PREFIX}   ${basename(fp)}: +${n} 候选`);
    totalCandidates += n;
  }

  // 2. L2→L3 晋升
  const candidates = scanCandidates();
  let promoted = 0;
  for (const c of candidates) {
    if (promoted >= MAX_PROMOTE_PER_RUN) break;   // 限速
    if (promoteCandidate(c)) promoted++;
  }

  // 3. L3→Wiki 合成
  const wikiCreated = synthesizeToWiki();

  // 4. 删除 7 天前的 L1
  const deleted = cleanupOldL1Files();

  // 5. 保存状态
  state.lastFullExtractionDate = today;
  savePromoterState(state);

  console.log(`${LOG_PREFIX} === 全量提取完成: L2候选+${totalCandidates} L3晋升+${promoted} Wiki+${wikiCreated.length} 删除旧L1-${deleted} ===`);

  return { l1Count: files.length, l2Count: totalCandidates, l3Count: promoted, wikiCount: wikiCreated.length, deleted };
}

/**
 * 增量提取：只处理今天的 L1（定时器触发）
 */
function runIncrementalExtraction(state: PromoterState): { l2Count: number; l3Count: number; wikiCount: number } {
  const today = localDate();
  const l1Path = join(L1_DIR, `${today}.md`);

  if (!existsSync(l1Path)) return { l2Count: 0, l3Count: 0, wikiCount: 0 };

  const n = processL1File(l1Path, today, state.knownFacts);
  if (n > 0) console.log(`${LOG_PREFIX} [增量] ${today}.md: +${n} 候选`);

  // 晋升
  const candidates = scanCandidates();
  let promoted = 0;
  for (const c of candidates) {
    if (promoted >= MAX_PROMOTE_PER_RUN) break;   // 限速
    if (promoteCandidate(c)) promoted++;
  }

  const wikiCreated = synthesizeToWiki();
  savePromoterState(state);

  return { l2Count: n, l3Count: promoted, wikiCount: wikiCreated.length };
}

// ============================================================
// 主扩展
// ============================================================

export default function (pi: ExtensionAPI) {
  let incrementalTimer: ReturnType<typeof setInterval> | null = null;

  pi.on("session_start", async (_event, ctx) => {
    try {
      // 确保目录存在
      for (const d of [L1_DIR, CANDIDATES_DIR, AGENT_DIR, WIKI_DIR, SYSTEM_DIR]) {
        if (!existsSync(d)) mkdirSync(d, { recursive: true });
      }

      const state = loadPromoterState();
      ctx.ui.setStatus("steel-will-promoter", "✓ promoter ready");

      // === 每天一次：全量提取 ===
      const result = runFullExtraction(state);
      if (result.l2Count > 0 || result.l3Count > 0 || result.deleted > 0) {
        ctx.ui.notify(
          `📈 每日记忆提炼完成\n` +
          `L1扫描: ${result.l1Count} 文件 → L2候选: +${result.l2Count}\n` +
          `L3晋升: +${result.l3Count} | Wiki合成: +${result.wikiCount}\n` +
          `清理: ${result.deleted} 个过期L1`,
          "info"
        );
      }

      // === 启动增量定时器（每 5 分钟） ===
      const INCREMENTAL_INTERVAL = 5 * 60 * 1000;
      incrementalTimer = setInterval(() => {
        try {
          const incResult = runIncrementalExtraction(state);
          if (incResult.l2Count > 0 || incResult.l3Count > 0) {
            console.log(`${LOG_PREFIX} [定时] L2+${incResult.l2Count} L3+${incResult.l3Count}`);
          }
        } catch (e: any) {
          console.error(`${LOG_PREFIX} 增量提取错误:`, e.message);
        }
      }, INCREMENTAL_INTERVAL);

      // ★ 关键修复：unref 让该定时器不阻塞进程退出。
      // 否则 pi -p / RPC 等非交互模式下，回答完毕后进程会被此定时器
      // 永久挂住（表现为"回复很慢"实则永不退出，只能被 timeout 杀掉）。
      if (incrementalTimer && typeof (incrementalTimer as any).unref === "function") {
        (incrementalTimer as any).unref();
      }

      console.log(`${LOG_PREFIX} 增量定时器已启动 (每${INCREMENTAL_INTERVAL / 60000}分钟)`);
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 初始化错误:`, e.message);
    }
  });

  // ============================================================
  // 会话结束时兜底触发
  // ============================================================

  pi.on("session_end", async (_event, ctx) => {
    try {
      // 清理定时器
      if (incrementalTimer) {
        clearInterval(incrementalTimer);
        incrementalTimer = null;
      }

      const state = loadPromoterState();
      const result = runIncrementalExtraction(state);
      if (result.l2Count > 0) {
        ctx.ui.notify(`会话结束: L2+${result.l2Count}`, "info");
      }
      console.log(`${LOG_PREFIX} 会话结束，管道已关闭`);
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 会话结束处理失败:`, e.message);
    }
  });

  // ============================================================
  // /promote 命令
  // ============================================================

  pi.registerCommand("promote", {
    description: "手动触发记忆晋升管道 (L1→L2→L3→Wiki)",
    handler: async (_args, ctx) => {
      try {
        const state = loadPromoterState();
        const today = localDate();

        // 强制全量（即使今天已执行过）
        const originalDate = state.lastFullExtractionDate;
        state.lastFullExtractionDate = ""; // 绕过日期检查
        const result = runFullExtraction(state);
        state.lastFullExtractionDate = originalDate;
        savePromoterState(state);

        ctx.ui.notify(
          `📈 晋升完成\n` +
          `L1→L2: +${result.l2Count} 候选\n` +
          `L2→L3: +${result.l3Count} 条目\n` +
          `L3→Wiki: +${result.wikiCount} 页\n` +
          `清理: ${result.deleted} 过期L1`,
          "info"
        );
      } catch (e: any) {
        ctx.ui.notify(`晋升失败: ${e.message}`, "error");
      }
    },
  });

  // ============================================================
  // /promote-status 命令
  // ============================================================

  pi.registerCommand("promote-status", {
    description: "查看晋升管道状态",
    handler: async (_args, ctx) => {
      try {
        const state = loadPromoterState();
        let text = `## 🔄 晋升管道状态\n\n`;

        // 全量提取状态
        text += `### 每日全量提取\n`;
        text += `- 上次执行: ${state.lastFullExtractionDate || "从未执行"}\n`;
        text += `- 已知事实: ${Object.keys(state.knownFacts).length} 条\n\n`;

        // L1
        const l1Files = getAllL1Files();
        text += `### L1 碎片 (保留7天)\n- 文件数: ${l1Files.length}\n`;
        for (const fp of l1Files.slice(-5)) {
          text += `  - ${basename(fp)}\n`;
        }
        if (l1Files.length > 5) text += `  - ... 还有 ${l1Files.length - 5} 个\n`;

        // L2
        let l2Total = 0;
        const l2States: Record<string, number> = {};
        for (const domain of ["user", "agent"]) {
          const d = join(CANDIDATES_DIR, domain);
          if (!existsSync(d)) continue;
          for (const f of readdirSync(d).filter(x => x.endsWith(".md"))) {
            l2Total++;
            try {
              const c = readFileSync(join(d, f), "utf-8");
              // 宽松匹配：L2 候选实际写法是「- **状态**: candidate」，原先只认全角「- 状态：」
              const m = c.match(/状态\**\s*[:：]\s*([^\n*]+)/);
              const s = m?.[1]?.trim() ?? "candidate";
              l2States[s] = (l2States[s] ?? 0) + 1;
            } catch { /* skip */ }
          }
        }
        text += `\n### L2 候选\n- 总数: ${l2Total}\n`;
        for (const [s, n] of Object.entries(l2States)) {
          text += `  - ${s}: ${n}\n`;
        }

        // L3
        const l3Dirs = ["lessons", "cases", "patterns", "decisions", "anti-patterns", "projects"];
        let l3Total = 0;
        text += `\n### L3 长期记忆\n`;
        for (const d of l3Dirs) {
          const dp = join(AGENT_DIR, d);
          const n = existsSync(dp) ? readdirSync(dp).filter(x => x.endsWith(".md")).length : 0;
          l3Total += n;
          text += `- ${d}: ${n}\n`;
        }

        // Wiki
        const wikiCats = ["entities", "concepts", "sources", "synthesis"];
        let wikiTotal = 0;
        text += `\n### Wiki 结构化\n`;
        for (const c of wikiCats) {
          const dp = join(WIKI_DIR, c);
          const n = existsSync(dp) ? readdirSync(dp).filter(x => x.endsWith(".md")).length : 0;
          wikiTotal += n;
          text += `- ${c}: ${n}\n`;
        }

        text += `\n**总计**: L1(${l1Files.length}) → L2(${l2Total}) → L3(${l3Total}) → Wiki(${wikiTotal})`;
        ctx.ui.notify(text, "info");
      } catch (e: any) {
        ctx.ui.notify(`状态查询失败: ${e.message}`, "error");
      }
    },
  });

  console.log(`${LOG_PREFIX} V2 加载完成`);
}
