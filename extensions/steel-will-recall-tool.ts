import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import semanticRetrievalService from "../services/steel-will-semantic-retrieval.ts";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const WORKSPACE_FILE = join(HOME_DIR, ".pi", "agent", "current-workspace");
const LOG_PREFIX = "[SteelWill-RecallTool]";

// ======================
// Workspace 管理层
// ======================

/** 读取当前工作区名称，无则返回 "global" */
function getCurrentWorkspace(): string {
  try {
    if (existsSync(WORKSPACE_FILE)) {
      const ws = readFileSync(WORKSPACE_FILE, "utf-8").trim();
      return ws || "global";
    }
  } catch { /* 文件不可读时回退 */ }
  return "global";
}

/** 设置当前工作区 */
function setCurrentWorkspace(name: string): void {
  const parent = join(HOME_DIR, ".pi", "agent");
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }
  writeFileSync(WORKSPACE_FILE, name.trim() || "global", "utf-8");
}

/** 确保工作区目录结构存在 */
function ensureWorkspaceDirs(workspace: string): void {
  if (workspace === "global") return;
  const wsBase = join(MEMORY_DIR, "workspace", workspace);
  const dirs = [
    join(wsBase, "l1"),
    join(wsBase, "wiki", "entities"),
    join(wsBase, "wiki", "concepts"),
    join(wsBase, "wiki", "sources"),
    join(wsBase, "wiki", "synthesis"),
    join(wsBase, "agent", "lessons"),
    join(wsBase, "agent", "cases"),
    join(wsBase, "agent", "decisions"),
    join(wsBase, "agent", "patterns"),
    join(wsBase, "candidates", "user"),
    join(wsBase, "candidates", "agent"),
  ];
  for (const d of dirs) {
    if (!existsSync(d)) {
      mkdirSync(d, { recursive: true });
    }
  }
}

/** 工作区路径权重加成 — 让当前工作区的优先于全局 */
const WORKSPACE_WEIGHT_BONUS = 1.15;

const MEMORY_PATHS = {
  wiki: join(MEMORY_DIR, "wiki"),
  wiki_entities: join(MEMORY_DIR, "wiki", "entities"),
  wiki_concepts: join(MEMORY_DIR, "wiki", "concepts"),
  wiki_sources: join(MEMORY_DIR, "wiki", "sources"),
  wiki_synthesis: join(MEMORY_DIR, "wiki", "synthesis"),
  l1: join(MEMORY_DIR, "l1"),
  l2_candidates: join(MEMORY_DIR, "candidates"),
  l3_agent: join(MEMORY_DIR, "agent"),
  l3_user: join(MEMORY_DIR, "user"),
  lessons: join(MEMORY_DIR, "agent", "lessons"),
  cases: join(MEMORY_DIR, "agent", "cases"),
  reflections: join(MEMORY_DIR, "reflections"),
};

type SearchMode = "semantic" | "lexical" | "hybrid";

type LexicalHit = {
  filePath: string;
  snippet: string;
  score: number;
};

type RecallHit = {
  text: string;
  score: number;
  source: string;
  filePath: string;
  bucket?: string;
  lane?: "wiki" | "memory";
};

// ======================
// 体裁感知预判层 (Genre-Aware Pre-Classification)
// ======================

/** 体裁分类结果 */
type GenreInfo = {
  genre: string;
  subgenre: string;
  confidence: number;
};

/** 搜索目录项 */
type SearchDirEntry = { path: string; name: string };

/** 默认搜索顺序 — 当前工作区（如有）路径优先于全局 */
function getDefaultSearchOrder(): SearchDirEntry[] {
  const ws = getCurrentWorkspace();
  const order: SearchDirEntry[] = [];

  if (ws !== "global") {
    // 工作区目录优先于全局同名目录
    const wsBase = join(MEMORY_DIR, "workspace", ws);
    const pairs: [string, string, string][] = [
      ["wiki-synthesis", join(wsBase, "wiki", "synthesis"), MEMORY_PATHS.wiki_synthesis],
      ["wiki-concepts",  join(wsBase, "wiki", "concepts"),  MEMORY_PATHS.wiki_concepts],
      ["wiki-entities",  join(wsBase, "wiki", "entities"),  MEMORY_PATHS.wiki_entities],
      ["wiki-sources",   join(wsBase, "wiki", "sources"),   MEMORY_PATHS.wiki_sources],
      ["ws-lessons",     join(wsBase, "agent", "lessons"),   MEMORY_PATHS.lessons],
      ["ws-cases",       join(wsBase, "agent", "cases"),     MEMORY_PATHS.cases],
      ["ws-l1",          join(wsBase, "l1"),                  MEMORY_PATHS.l1],
    ];
    for (const [name, wsPath, globalPath] of pairs) {
      if (existsSync(wsPath)) {
        order.push({ path: wsPath, name: `ws:${name}` });
      }
      order.push({ path: globalPath, name });
    }
    // 其余全局目录（不分 workspace/global 的）
    order.push(
      { path: MEMORY_PATHS.l3_agent, name: "l3-agent" },
      { path: MEMORY_PATHS.l3_user, name: "l3-user" },
      { path: MEMORY_PATHS.l2_candidates, name: "l2-candidates" },
      { path: MEMORY_PATHS.reflections, name: "reflections" },
    );
  } else {
    // global 模式 — 原始顺序
    order.push(
      { path: MEMORY_PATHS.wiki_synthesis, name: "wiki-synthesis" },
      { path: MEMORY_PATHS.wiki_concepts, name: "wiki-concepts" },
      { path: MEMORY_PATHS.wiki_entities, name: "wiki-entities" },
      { path: MEMORY_PATHS.wiki_sources, name: "wiki-sources" },
      { path: MEMORY_PATHS.lessons, name: "lessons" },
      { path: MEMORY_PATHS.cases, name: "cases" },
      { path: MEMORY_PATHS.l3_agent, name: "l3-agent" },
      { path: MEMORY_PATHS.l3_user, name: "l3-user" },
      { path: MEMORY_PATHS.l2_candidates, name: "l2-candidates" },
      { path: MEMORY_PATHS.l1, name: "l1-fragments" },
      { path: MEMORY_PATHS.reflections, name: "reflections" },
    );
  }
  return order;
}

/**
 * 体裁感知分类器 — 纯关键词+模式匹配，零外部依赖
 *
 * 5 种体裁 + general（无明确体裁时用默认顺序）：
 *   definition  → 优先 wiki-concepts, wiki-entities（概念定义）
 *   process     → 优先 lessons, cases, patterns（方法步骤）
 *   argument    → 优先 reflections, wiki-synthesis（分析论证）
 *   data_summary → 优先 wiki-sources, wiki-synthesis（数据报告）
 *   dialogue    → 优先 l1, wiki-entities（对话上下文）
 *   general     → 使用默认搜索顺序
 *
 * 置信度 < 0.3 时回退到默认顺序，防止误分类干扰检索。
 */
class GenreClassifier {
  private static GENRES: Record<string, {
    patterns: RegExp[];
    nameOrder: string[];
    decayPerMonth: number;
  }> = {
    definition: {
      patterns: [
        /是什么/g, /什么是/g, /定义/g, /是指/g, /指的是/g,
        /意为/g, /就是/g, /即/g, /含义/g, /概念/g, /术语/g,
      ],
      nameOrder: [
        "wiki-concepts", "wiki-entities", "wiki-synthesis",
        "wiki-sources", "lessons", "cases", "patterns",
        "l3-agent", "l3-user", "l2-candidates", "l1-fragments", "reflections",
      ],
      decayPerMonth: 0.005,
    },
    process: {
      patterns: [
        /怎么/g, /如何/g, /步骤/g, /流程/g, /方法/g,
        /怎样/g, /怎么做/g, /操作/g, /实现/g, /配置/g,
        /教程/g, /指南/g, /搭建/g,
      ],
      nameOrder: [
        "lessons", "cases", "patterns",
        "wiki-concepts", "wiki-synthesis",
        "wiki-entities", "wiki-sources",
        "l3-agent", "l3-user", "l2-candidates", "l1-fragments", "reflections",
      ],
      decayPerMonth: 0.01,
    },
    argument: {
      patterns: [
        /为什么/g, /原因/g, /是否/g, /分析/g, /对比/g,
        /论证/g, /因果/g, /因为/g, /所以/g, /因此/g,
        /导致/g, /影响/g, /关系/g, /逻辑/g, /推理/g,
      ],
      nameOrder: [
        "reflections", "wiki-synthesis", "cases",
        "lessons", "wiki-concepts",
        "wiki-entities", "wiki-sources",
        "l3-agent", "l3-user", "l2-candidates", "patterns", "l1-fragments",
      ],
      decayPerMonth: 0.02,
    },
    data_summary: {
      patterns: [
        /多少/g, /数据/g, /统计/g, /占比/g, /趋势/g,
        /总量/g, /数字/g, /数量/g, /比例/g, /报告/g,
        /图表/g, /汇总/g,
      ],
      nameOrder: [
        "wiki-sources", "wiki-synthesis", "cases",
        "wiki-concepts", "wiki-entities",
        "lessons", "patterns",
        "l3-agent", "l3-user", "l2-candidates", "l1-fragments", "reflections",
      ],
      decayPerMonth: 0.015,
    },
    dialogue: {
      patterns: [
        /你好/g, /谢谢/g, /嗯/g, /好的/g, /哈哈/g,
        /早安/g, /晚安/g, /没事/g, /是的/g, /OK/g,
        /嗨/g, /拜拜/g, /再见/g,
      ],
      nameOrder: [
        "l1-fragments", "wiki-entities", "wiki-concepts",
        "lessons", "cases",
        "wiki-synthesis", "wiki-sources",
        "l3-agent", "l3-user", "l2-candidates", "patterns", "reflections",
      ],
      decayPerMonth: 0.03,
    },
  };

  private static CONFIDENCE_FLOOR = 0.3;

  static classify(query: string): GenreInfo {
    if (!query || !query.trim()) {
      return { genre: "dialogue", subgenre: "", confidence: 1.0 };
    }

    const results: { genre: string; score: number }[] = [];

    for (const [genre, def] of Object.entries(this.GENRES)) {
      let score = 0;
      for (const pattern of def.patterns) {
        pattern.lastIndex = 0;
        const matches = query.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      if (score > 0) {
        results.push({ genre, score });
      }
    }

    if (results.length === 0) {
      return { genre: "general", subgenre: "", confidence: 0.0 };
    }

    results.sort((a, b) => b.score - a.score);
    const best = results[0];
    const second = results[1];

    let confidence: number;
    if (!second) {
      confidence = 0.9;
    } else {
      confidence = best.score / (best.score + second.score);
    }

    return {
      genre: best.genre,
      subgenre: "",
      confidence,
    };
  }

  static getSearchOrder(genreInfo: GenreInfo): SearchDirEntry[] {
    if (genreInfo.confidence < this.CONFIDENCE_FLOOR) {
      return getDefaultSearchOrder();
    }

    const def = this.GENRES[genreInfo.genre];
    if (!def) return getDefaultSearchOrder();

    const defaultOrder = getDefaultSearchOrder();
    const nameToEntry = new Map(defaultOrder.map(e => [e.name, e]));

    const reordered: SearchDirEntry[] = [];
    for (const name of def.nameOrder) {
      const entry = nameToEntry.get(name);
      if (entry) {
        reordered.push(entry);
        nameToEntry.delete(name);
      }
    }
    for (const [, entry] of nameToEntry) {
      reordered.push(entry);
    }

    return reordered;
  }

  static getDecayRate(genre: string): number {
    return this.GENRES[genre]?.decayPerMonth ?? 0.01;
  }
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function getPathWeight(filePath: string): number {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  const isWorkspace = normalizedPath.includes("/memory/workspace/");
  const bonus = isWorkspace ? WORKSPACE_WEIGHT_BONUS : 1.0;

  let weight = 1;

  if (normalizedPath.includes("/memory/wiki/synthesis/")) {
    weight = 1.28;
  } else if (normalizedPath.includes("/memory/wiki/concepts/")) {
    weight = 1.24;
  } else if (normalizedPath.includes("/memory/wiki/entities/")) {
    weight = 1.2;
  } else if (normalizedPath.includes("/memory/wiki/sources/")) {
    weight = 1.16;
  } else if (normalizedPath.includes("/memory/agent/lessons/")) {
    weight = 1.2;
  } else if (normalizedPath.includes("/memory/agent/cases/")) {
    weight = 1.18;
  } else if (normalizedPath.includes("/memory/agent/patterns/")) {
    weight = 1.16;
  } else if (normalizedPath.includes("/memory/agent/anti-patterns/")) {
    weight = 1.16;
  } else if (normalizedPath.includes("/memory/l1/")) {
    weight = normalizedPath.includes("-index.md") ? 0.72 : 1;
  }

  return weight * bonus;
}

function inferBucket(filePath: string): string {
  const normalizedPath = filePath.replace(/\\/g, "/").toLowerCase();
  const wsPrefix = normalizedPath.includes("/memory/workspace/") ? "ws:" : "";

  if (normalizedPath.includes("/memory/wiki/synthesis/")) return wsPrefix + "wiki-synthesis";
  if (normalizedPath.includes("/memory/wiki/concepts/")) return wsPrefix + "wiki-concept";
  if (normalizedPath.includes("/memory/wiki/entities/")) return wsPrefix + "wiki-entity";
  if (normalizedPath.includes("/memory/wiki/sources/")) return wsPrefix + "wiki-source";
  if (normalizedPath.includes("/memory/agent/lessons/")) return wsPrefix + "l3-lesson";
  if (normalizedPath.includes("/memory/agent/cases/")) return wsPrefix + "l3-case";
  if (normalizedPath.includes("/memory/agent/patterns/")) return wsPrefix + "l3-pattern";
  if (normalizedPath.includes("/memory/agent/anti-patterns/")) return wsPrefix + "l3-anti-pattern";
  if (normalizedPath.includes("/memory/l1/") && normalizedPath.includes("-index.md")) return wsPrefix + "l1-index";
  if (normalizedPath.includes("/memory/l1/")) return wsPrefix + "l1";
  return "other";
}

function inferLane(filePath: string): "wiki" | "memory" {
  return filePath.replace(/\\/g, "/").toLowerCase().includes("/memory/wiki/") ? "wiki" : "memory";
}

function formatSourceLabel(hit: RecallHit): string {
  switch (hit.bucket) {
    case "wiki-synthesis":
      return "Wiki Synthesis";
    case "wiki-concept":
      return "Wiki Concept";
    case "wiki-entity":
      return "Wiki Entity";
    case "wiki-source":
      return "Wiki Source";
    case "l3-lesson":
      return "L3 Lesson";
    case "l3-case":
      return "L3 Case";
    case "l3-pattern":
      return "L3 Pattern";
    case "l3-anti-pattern":
      return "L3 Anti-Pattern";
    case "l1-index":
      return "L1 Index";
    case "l1":
      return "L1 Fragment";
    default:
      return hit.source;
  }
}

function formatSnippet(text: string, filePath: string): string {
  if (!filePath.replace(/\\/g, "/").toLowerCase().includes("/memory/wiki/")) {
    return text;
  }

  const summaryMatch = text.match(/## Summary\s+([\s\S]*?)\n## Content/m);
  if (summaryMatch?.[1]?.trim()) {
    return summaryMatch[1].trim();
  }

  return text;
}

function lexicalSearch(query: string, dirPath: string, maxResults: number = 5): LexicalHit[] {
  const results: LexicalHit[] = [];

  if (!existsSync(dirPath)) {
    return results;
  }

  try {
    const files = readdirSync(dirPath).filter((file) => file.endsWith(".md"));

    for (const file of files) {
      const filePath = join(dirPath, file);

      try {
        const content = readFileSync(filePath, "utf-8");
        const lowerContent = content.toLowerCase();
        const queryWords = normalizeText(query).split(/\s+/).filter((word) => word.length > 1);
        const normalizedFileName = normalizeText(file);

        let matchCount = 0;
        let bestSnippet = "";
        let bestSnippetScore = 0;
        let fileNameScore = 0;

        for (const queryWord of queryWords) {
          if (normalizedFileName.includes(queryWord)) {
            fileNameScore++;
          }
        }

        for (const word of queryWords) {
          const index = lowerContent.indexOf(word);
          if (index === -1) {
            continue;
          }

          matchCount++;
          const start = Math.max(0, index - 100);
          const end = Math.min(content.length, index + 200);
          const snippet = content.substring(start, end).replace(/\n/g, " ").trim();

          let snippetScore = 0;
          for (const queryWord of queryWords) {
            if (snippet.toLowerCase().includes(queryWord)) {
              snippetScore++;
            }
          }

          if (snippetScore > bestSnippetScore) {
            bestSnippet = snippet;
            bestSnippetScore = snippetScore;
          }
        }

        if (matchCount > 0 || fileNameScore > 0) {
          const pathWeight = getPathWeight(filePath);
          const blendedScore =
            ((matchCount + fileNameScore * 1.35) / Math.max(1, queryWords.length)) * pathWeight;
          const snippetSource = bestSnippet || content.substring(0, 240).replace(/\n/g, " ").trim();

          results.push({
            filePath,
            snippet: formatSnippet(snippetSource, filePath),
            score: blendedScore,
          });
        }
      } catch {
        // Ignore unreadable files and continue scanning.
      }
    }
  } catch {
    // Ignore unreadable directories and continue scanning.
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

function searchAllMemoryDirs(query: string, maxResults: number = 5, searchOrder?: SearchDirEntry[]): RecallHit[] {
  const allResults: RecallHit[] = [];
  const order = searchOrder ?? getDefaultSearchOrder();

  for (const { path, name } of order) {
    const results = lexicalSearch(query, path, 2);
    for (const result of results) {
      allResults.push({
        text: result.snippet,
        score: result.score,
        source: `lexical:${name}`,
        filePath: result.filePath,
        bucket: inferBucket(result.filePath),
        lane: inferLane(result.filePath),
      });
    }
  }

  return allResults.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

function mergeRecallResults(semanticHits: RecallHit[], lexicalHits: RecallHit[], topK: number): RecallHit[] {
  const merged = new Map<string, RecallHit>();

  for (const hit of semanticHits) {
    merged.set(hit.filePath, { ...hit });
  }

  for (const hit of lexicalHits) {
    const key = hit.filePath;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, { ...hit });
      continue;
    }

    existing.score = Math.max(existing.score, hit.score);
    if (existing.text.length < hit.text.length && existing.lane !== "wiki") {
      existing.text = hit.text;
    }
    if (!existing.source.includes("lexical")) {
      existing.source = `${existing.source}+lexical`;
    }
  }

  return Array.from(merged.values())
    .map((hit) => ({
      ...hit,
      score: hit.score * getPathWeight(hit.filePath),
      bucket: hit.bucket ?? inferBucket(hit.filePath),
      lane: hit.lane ?? inferLane(hit.filePath),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    try {
      const ws = getCurrentWorkspace();
      ensureWorkspaceDirs(ws);
      console.log(`${LOG_PREFIX} recall_memory tool loaded, workspace="${ws}"`);
      ctx.ui.setStatus("steel-will-recall", ws !== "global" ? `OK ws:${ws}` : "OK recall_memory ready");
    } catch (error: any) {
      console.error(`${LOG_PREFIX} initialization failed`, error?.message ?? error);
      ctx.ui.setStatus("steel-will-recall", "ERR recall_memory");
    }
  });

  pi.registerTool({
    name: "recall_memory",
    label: "Recall Memory",
    description:
      "Search the Steel Will memory system for relevant memories. Supports semantic search, lexical fallback, and hybrid mode.",
    promptSnippet: "Search the Steel Will memory system for relevant memories",
    promptGuidelines: [
      "Use recall_memory when you need past events, lessons, cases, or user preferences.",
      "Prefer semantic or hybrid mode when the query is conceptual rather than exact-keyword based.",
      "If semantic retrieval is unavailable, the tool will fall back to lexical search.",
    ],
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search text or a semantic description of the memory you want to recall.",
        },
        top_k: {
          type: "number",
          description: "Maximum number of results to return.",
          default: 3,
        },
        search_mode: {
          type: "string",
          description: "semantic, lexical, or hybrid. Defaults to hybrid.",
          default: "hybrid",
        },
      },
      required: ["query"],
    },

    async execute(_toolCallId, params, _signal, onUpdate) {
      const query = params.query as string;
      const top_k = Number(params.top_k ?? 3);
      const search_mode = (params.search_mode ?? "hybrid") as SearchMode;

      console.log(`${LOG_PREFIX} query="${query}" mode=${search_mode} top_k=${top_k}`);
      onUpdate?.({
        content: [{ type: "text", text: `Searching memory for "${query}"...` }],
      });

      try {
        let results: RecallHit[] = [];
        let semanticError: string | null = null;

        // 体裁感知预判 — 在所有检索前运行，调整搜索优先级
        const genreInfo = GenreClassifier.classify(query);
        const genreOrder = GenreClassifier.getSearchOrder(genreInfo);
        console.log(`${LOG_PREFIX} genre=${genreInfo.genre} confidence=${genreInfo.confidence.toFixed(2)}`);

        // 记录体裁触发（供成就系统消费）
        if (genreInfo.confidence >= 0.5 && genreInfo.genre !== "general") {
          try {
            const genreTriggersPath = join(MEMORY_DIR, "system", "genre_triggers.json");
            let triggers: string[] = [];
            if (existsSync(genreTriggersPath)) {
              triggers = JSON.parse(readFileSync(genreTriggersPath, "utf-8"));
            }
            if (!triggers.includes(genreInfo.genre)) {
              triggers.push(genreInfo.genre);
              const parent = join(MEMORY_DIR, "system");
              if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
              writeFileSync(genreTriggersPath, JSON.stringify(triggers), "utf-8");
            }
          } catch { /* 静默 */ }
        }

        if (search_mode === "semantic" || search_mode === "hybrid") {
          try {
            onUpdate?.({
              content: [{ type: "text", text: "Running semantic retrieval..." }],
            });

            const semanticResults = await semanticRetrievalService.searchMemory(
              query,
              search_mode === "hybrid" ? top_k * 2 : top_k,
            );

            results = semanticResults.map((result) => ({
              text: formatSnippet(result.text, result.metadata.filePath),
              score: result.score,
              source: `semantic:${result.metadata.memoryType}`,
              filePath: result.metadata.filePath,
              bucket: String(result.metadata.bucket ?? inferBucket(result.metadata.filePath)),
              lane: inferLane(result.metadata.filePath),
            }));
          } catch (error: any) {
            semanticError = error?.message ?? String(error);
            console.error(`${LOG_PREFIX} semantic retrieval failed`, semanticError);
          }
        }

        if (search_mode === "lexical" || search_mode === "hybrid" || results.length === 0) {
          onUpdate?.({
            content: [{ type: "text", text: "Running lexical retrieval..." }],
          });

          const lexicalResults = searchAllMemoryDirs(
            query,
            search_mode === "hybrid" ? top_k * 2 : top_k,
            genreOrder,
          );

          if (search_mode === "hybrid") {
            results = mergeRecallResults(results, lexicalResults, top_k);
          } else if (search_mode === "lexical" || results.length === 0) {
            results = lexicalResults.slice(0, top_k);
          }
        }

        if (results.length === 0) {
          const fallbackNote = semanticError ? `\nSemantic retrieval failed: ${semanticError}` : "";
          return {
            content: [
              {
                type: "text",
                text:
                  `No relevant memory found for "${query}".\n\n` +
                  `Suggestions:\n` +
                  `1. Try a shorter or more concrete query.\n` +
                  `2. Confirm the memory has been written into the system.\n` +
                  `3. Use /steel-will-index to inspect the memory index.` +
                  fallbackNote,
              },
            ],
            details: { query, results: [], totalFound: 0, searchMode: search_mode, semanticError },
          };
        }

        let resultText = `Memory Search Results\n`;
        resultText += `====================\n`;
        resultText += `Query: "${query}"\n`;
        resultText += `Mode: ${search_mode}\n`;
        resultText += `Genre: ${genreInfo.genre} (confidence: ${(genreInfo.confidence * 100).toFixed(0)}%)\n`;
        resultText += `Found: ${results.length}\n\n`;

        if (semanticError) {
          resultText += `Semantic retrieval failed, lexical fallback was used: ${semanticError}\n\n`;
        }

        results.forEach((result, index) => {
          const filePathShort = result.filePath.replace(MEMORY_DIR, "~/.pi/agent/memory");
          const scorePercent = Math.round(result.score * 100);
          const sourceLabel = formatSourceLabel(result);
          const laneLabel = result.lane === "wiki" ? "Wiki Primary" : "Memory Recall";

          resultText += `Result ${index + 1}\n`;
          resultText += `File: ${filePathShort}\n`;
          resultText += `Score: ${scorePercent}%\n`;
          resultText += `Lane: ${laneLabel}\n`;
          resultText += `Source: ${sourceLabel}\n`;
          resultText += `Content:\n${result.text}\n\n`;
        });

        resultText += `Tip: use the read tool for the full source file.`;

        return {
          content: [{ type: "text", text: resultText }],
          details: {
            query,
            results: results.map((result) => ({
              filePath: result.filePath,
              score: result.score,
              source: result.source,
              bucket: result.bucket,
              lane: result.lane,
              snippet: result.text.substring(0, 200),
            })),
            totalFound: results.length,
            searchMode: search_mode,
            semanticError,
          },
        };
      } catch (error: any) {
        console.error(`${LOG_PREFIX} recall_memory failed`, error);
        return {
          content: [
            {
              type: "text",
              text: `Memory search failed: ${error.message}\n\nPlease retry or inspect memory files manually with the read tool.`,
            },
          ],
          details: { error: error.message },
          isError: true,
        };
      }
    },
  });

  pi.registerCommand("recall-status", {
    description: "Show recall_memory tool status",
    handler: async (_args, ctx) => {
      try {
        let statusText = `## recall_memory Status\n\n`;
        const ws = getCurrentWorkspace();
        statusText += `- Tool registered: yes\n`;
        statusText += `- Workspace: **${ws}**\n`;
        statusText += `- Semantic retrieval: enabled with lexical fallback\n`;
        statusText += `- Genre pre-classification: active\n`;
        statusText += `\n## Global Memory directories:\n`;

        for (const [name, path] of Object.entries(MEMORY_PATHS)) {
          statusText += `- ${name}: ${existsSync(path) ? "yes" : "no"} ${path}\n`;
        }

        if (ws !== "global") {
          const wsBase = join(MEMORY_DIR, "workspace", ws);
          statusText += `\n## Workspace directories (${ws}):\n`;
          const wsDirs = [
            ["l1", join(wsBase, "l1")],
            ["wiki/entities", join(wsBase, "wiki", "entities")],
            ["wiki/concepts", join(wsBase, "wiki", "concepts")],
            ["wiki/sources", join(wsBase, "wiki", "sources")],
            ["wiki/synthesis", join(wsBase, "wiki", "synthesis")],
            ["agent/lessons", join(wsBase, "agent", "lessons")],
            ["agent/cases", join(wsBase, "agent", "cases")],
          ];
          for (const [label, p] of wsDirs) {
            statusText += `- ${label}: ${existsSync(p) ? "yes" : "no"} ${p}\n`;
          }
        }

        ctx.ui.notify(statusText, "info");
      } catch (error: any) {
        ctx.ui.notify(`Status query failed: ${error.message}`, "error");
      }
    },
  });

  pi.registerCommand("workspace", {
    description: "Show or set Steel Will workspace",
    handler: async (_args, ctx) => {
      try {
        const ws = getCurrentWorkspace();
        let msg = `## Steel Will Workspace\n\n`;
        msg += `- Current: **${ws}**\n`;
        msg += `- Config file: ${WORKSPACE_FILE}\n`;
        msg += `\nCommands:\n`;
        msg += `- \`/workspace-set <name>\` — switch workspace\n`;
        msg += `- \`/workspace-global\` — reset to global\n`;
        msg += `- \`/workspace-init\` — init dirs for current workspace\n`;
        ctx.ui.notify(msg, "info");
      } catch (error: any) {
        ctx.ui.notify(`Workspace query failed: ${error.message}`, "error");
      }
    },
  });

  pi.registerCommand("workspace-set", {
    description: "Switch Steel Will workspace (usage: /workspace-set <name>)",
    handler: async (args: any, ctx: any) => {
      try {
        const name = (args?._ ?? args ?? "").toString().trim();
        if (!name) {
          ctx.ui.notify("Usage: /workspace-set <name>\n\nExample: /workspace-set my-project", "warning");
          return;
        }
        setCurrentWorkspace(name);
        ensureWorkspaceDirs(name);
        ctx.ui.setStatus("steel-will-recall", `OK ws:${name}`);
        ctx.ui.notify(`✅ Workspace set to **${name}**\n\nDirectories created under memory/workspace/${name}/`, "info");
      } catch (error: any) {
        ctx.ui.notify(`Workspace set failed: ${error.message}`, "error");
      }
    },
  });

  pi.registerCommand("workspace-global", {
    description: "Reset Steel Will workspace to global",
    handler: async (_args, ctx) => {
      try {
        setCurrentWorkspace("global");
        ctx.ui.setStatus("steel-will-recall", "OK recall_memory ready");
        ctx.ui.notify("✅ Workspace reset to **global**", "info");
      } catch (error: any) {
        ctx.ui.notify(`Workspace reset failed: ${error.message}`, "error");
      }
    },
  });

  pi.registerCommand("workspace-init", {
    description: "Ensure workspace directories exist",
    handler: async (_args, ctx) => {
      try {
        const ws = getCurrentWorkspace();
        ensureWorkspaceDirs(ws);
        ctx.ui.notify(`✅ Workspace **${ws}** directories ensured`, "info");
      } catch (error: any) {
        ctx.ui.notify(`Workspace init failed: ${error.message}`, "error");
      }
    },
  });

  console.log(`${LOG_PREFIX} extension loaded`);
}
