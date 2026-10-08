/**
 * 钢铁意志·PI版 — 包34：事实有效期窗口与取代链
 *
 * 概念来源：Graphiti 的 temporal knowledge graph
 *   "Unlike static knowledge graphs, Graphiti's context graphs track how facts
 *    change over time... each fact has a validity window: when it became true,
 *    and when (if ever) it was superseded."
 *
 * 本实现刻意不引入图数据库（2GB 内存机器不划算），改用 sidecar JSON + 检索层降权：
 *   - memory/system/temporal.json 记录每个条目的时间元数据
 *   - services/steel-will-semantic-retrieval.ts 在检索时按权重压制
 *   - 被取代/过期的条目**永不删除**，保留历史可查（这一点与 Graphiti 一致）
 *
 * 这补上了原先的一个真实空缺：`filter_results` 之所以"无物可滤"，
 * 是因为我们从来没有写过「有效期」这个字段。
 *
 * 工具：
 *   - mark_superseded        声明「新条目取代旧条目」
 *   - set_memory_validity    设置有效期窗口与置信度
 *   - list_temporal          查看时间索引
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, basename } from "path";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const SYSTEM_DIR = join(MEMORY_DIR, "system");
const TEMPORAL_PATH = join(SYSTEM_DIR, "temporal.json");
const LOG_PREFIX = "[SteelWill-Temporal]";

type TemporalMeta = {
  valid_from?: string;
  valid_until?: string;
  superseded_by?: string;
  superseded_at?: string;
  supersede_reason?: string;
  confidence?: number;
};

type TemporalIndex = Record<string, TemporalMeta>;

function loadIndex(): TemporalIndex {
  try {
    if (!existsSync(TEMPORAL_PATH)) return {};
    return JSON.parse(readFileSync(TEMPORAL_PATH, "utf-8")) as TemporalIndex;
  } catch (e: any) {
    console.error(`${LOG_PREFIX} 读取失败:`, e?.message ?? e);
    return {};
  }
}

function saveIndex(idx: TemporalIndex): void {
  if (!existsSync(SYSTEM_DIR)) mkdirSync(SYSTEM_DIR, { recursive: true });
  writeFileSync(TEMPORAL_PATH, JSON.stringify(idx, null, 2), "utf-8");
}

/** 把任意路径规范成「相对 memory/」或原样，便于检索层匹配 */
function normalizeKey(p: string): string {
  const s = p.replace(/\\/g, "/").trim();
  const marker = "/memory/";
  const i = s.indexOf(marker);
  if (i >= 0) return s.slice(i + 1); // "memory/..."
  if (s.startsWith("memory/")) return s;
  return s;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event: any, ctx: any) => {
    try {
      if (!existsSync(SYSTEM_DIR)) mkdirSync(SYSTEM_DIR, { recursive: true });
      if (!existsSync(TEMPORAL_PATH)) saveIndex({});
      const n = Object.keys(loadIndex()).length;
      ctx.ui?.setStatus?.("steel-will-temporal", `⏳ temporal:${n}`);
      console.log(`${LOG_PREFIX} 时间索引已加载，共 ${n} 条有效期记录`);
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 初始化失败:`, e?.message ?? e);
    }
  });

  // ---------------- mark_superseded ----------------
  pi.registerTool({
    name: "mark_superseded",
    label: "Mark Superseded",
    description:
      "声明「新条目取代旧条目」。旧条目不会被删除，但检索时会被强降权，并附带取代说明。用于处理记忆冲突与信息过时。",
    promptSnippet: "Mark an old memory as superseded by a newer one",
    promptGuidelines: [
      "当发现两条记忆互相冲突、或旧结论已被新结论覆盖时，用它标记取代关系。",
      "old_path 填被取代的条目路径，new_path 填取代它的新条目路径。",
      "不要删除旧条目 —— 历史要保留，靠降权而不是删除来解决冲突。",
    ],
    parameters: {
      type: "object",
      properties: {
        old_path: { type: "string", description: "被取代的旧条目路径" },
        new_path: { type: "string", description: "取代它的新条目路径" },
        reason: { type: "string", description: "取代原因（一句话）" },
      },
      required: ["old_path", "new_path"],
    },
    async execute(args: any) {
      const oldKey = normalizeKey(String(args.old_path));
      const newKey = normalizeKey(String(args.new_path));
      const idx = loadIndex();
      idx[oldKey] = {
        ...(idx[oldKey] || {}),
        superseded_by: newKey,
        superseded_at: new Date().toISOString(),
        supersede_reason: args.reason ? String(args.reason) : undefined,
      };
      // 新条目自身补 valid_from
      idx[newKey] = { ...(idx[newKey] || {}), valid_from: idx[newKey]?.valid_from ?? new Date().toISOString() };
      saveIndex(idx);
      console.log(`${LOG_PREFIX} ${oldKey} 已被 ${newKey} 取代`);
      return {
        content: [{
          type: "text",
          text: `已标记取代关系\n  旧: ${oldKey}\n  新: ${newKey}\n  原因: ${args.reason ?? "(未填)"}\n\n旧条目保留但检索降权至 25%。`,
        }],
        details: { old: oldKey, new: newKey },
      };
    },
  });

  // ---------------- set_memory_validity ----------------
  pi.registerTool({
    name: "set_memory_validity",
    label: "Set Memory Validity",
    description:
      "给记忆条目设置有效期窗口与置信度。valid_until 到期后条目仍保留，但检索时降权。",
    promptSnippet: "Set a validity window / confidence for a memory entry",
    promptGuidelines: [
      "适用于有时效性的结论（如「某服务当前部署在某端口」「某方案暂定」）。",
      "valid_until 用 ISO 日期（如 2026-12-31）。留空表示长期有效。",
      "confidence 取 0~1；低于 1 会等比例降权，用于标注把握不足的结论。",
    ],
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "记忆条目路径" },
        valid_until: { type: "string", description: "有效期截止（ISO 日期或完整时间戳）" },
        confidence: { type: "number", description: "置信度 0~1" },
      },
      required: ["path"],
    },
    async execute(args: any) {
      const key = normalizeKey(String(args.path));
      const idx = loadIndex();
      const cur = idx[key] || {};
      idx[key] = {
        ...cur,
        valid_from: cur.valid_from ?? new Date().toISOString(),
        ...(args.valid_until ? { valid_until: String(args.valid_until) } : {}),
        ...(typeof args.confidence === "number" ? { confidence: Number(args.confidence) } : {}),
      };
      saveIndex(idx);
      return {
        content: [{
          type: "text",
          text: `已设置有效期\n  ${key}\n  valid_until: ${idx[key].valid_until ?? "(长期)"}\n  confidence: ${idx[key].confidence ?? 1}`,
        }],
        details: idx[key],
      };
    },
  });

  // ---------------- list_temporal ----------------
  pi.registerTool({
    name: "list_temporal",
    label: "List Temporal Index",
    description: "查看当前时间索引：哪些条目已被取代、哪些已过期、置信度分布。",
    promptSnippet: "List the temporal validity index",
    promptGuidelines: ["用它在记忆巡检时确认冲突与过时条目是否已被正确标记。"],
    parameters: { type: "object", properties: {} },
    async execute() {
      const idx = loadIndex();
      const keys = Object.keys(idx);
      const superseded = keys.filter((k) => idx[k].superseded_by);
      const now = Date.now();
      const expired = keys.filter(
        (k) => idx[k].valid_until && !Number.isNaN(Date.parse(idx[k].valid_until!)) && Date.parse(idx[k].valid_until!) < now,
      );
      const lowConf = keys.filter((k) => typeof idx[k].confidence === "number" && idx[k].confidence! < 1);
      return {
        content: [{
          type: "text",
          text: [
            `时间索引共 ${keys.length} 条`,
            `  已被取代: ${superseded.length}`,
            `  已过期  : ${expired.length}`,
            `  低置信度: ${lowConf.length}`,
            "",
            superseded.length ? `被取代明细:\n${superseded.map((k) => `  ${basename(k)} → ${basename(idx[k].superseded_by!)}`).join("\n")}` : "(无取代记录)",
          ].join("\n"),
        }],
        details: { total: keys.length, superseded, expired, lowConf },
      };
    },
  });
}
