/**
 * 钢铁意志·PI版 — 包35：自知之明 与 记忆新陈代谢
 *
 * 补两个真实空缺：
 *   ① 小鑫以前答不出「我记了多少东西 / 现在什么在跑」→ self_status
 *   ② 记忆只进不出、从不衰减 → 冷宫/热点规则 + decay 报告
 *
 * 工具：
 *   - self_status      一体式自述：记忆分布 / 检索资产 / 扩展 / 服务 / 定时 / 指标
 *   - usage_report     使用账本：最常被召回的记忆、从未被召回的沉睡条目
 *   - detect_conflicts 冲突暴露：给定新内容，找出可能与之矛盾的既有条目
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const AGENT_DIR = join(HOME_DIR, ".pi", "agent");
const MEMORY_DIR = join(AGENT_DIR, "memory");
const LOG_PREFIX = "[SteelWill-SelfStatus]";

function countFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    try {
      if (statSync(p).isDirectory()) n += countFiles(p);
      else n += 1;
    } catch { /* ignore */ }
  }
  return n;
}

function readJson(p: string, d: any = null): any {
  try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf-8")) : d; }
  catch { return d; }
}

function sh(cmd: string): string {
  try { return execSync(cmd, { timeout: 8000, stdio: ["ignore", "pipe", "ignore"] })
    .toString().trim(); }
  catch { return ""; }
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async () => {
    console.log(`${LOG_PREFIX} 自知之明模块已加载`);
  });

  // ---------------- self_status ----------------
  pi.registerTool({
    name: "self_status",
    label: "Self Status",
    description:
      "一体式自述：我的记忆分布、检索资产、扩展开关、服务状态、定时任务、最新评测指标。用来回答「你现在是什么状态」「你记得多少东西」。",
    promptSnippet: "Report my own memory / assets / services / metrics status",
    promptGuidelines: [
      "当用户问「你记得多少」「你现在什么状态」「有什么在跑」时，直接调用它，不要逐项去猜或去 ls。",
      "它一次性给出全部客观状态，避免多次零散查询。",
    ],
    parameters: { type: "object", properties: {} },
    async execute() {
      const layers: Array<[string, string]> = [
        ["L1 原始日志", join(MEMORY_DIR, "l1")],
        ["L2 候选", join(MEMORY_DIR, "candidates")],
        ["WIKI 知识页", join(MEMORY_DIR, "wiki")],
        ["L3 长期记忆", join(MEMORY_DIR, "agent")],
        ["  └ 程序性记忆", join(MEMORY_DIR, "agent", "procedures")],
        ["  └ 教训", join(MEMORY_DIR, "agent", "lessons")],
        ["  └ 反模式", join(MEMORY_DIR, "agent", "anti-patterns")],
        ["  └ 案例", join(MEMORY_DIR, "agent", "cases")],
        ["归档协议", join(MEMORY_DIR, "archive", "protocols")],
      ];
      const memLines = layers.map(([n, p]) => `  ${n.padEnd(18)} ${countFiles(p)}`).join("\n");

      const idx = readJson(join(MEMORY_DIR, "system", "vector_db", "index.json"), { items: [] });
      const temporal = readJson(join(MEMORY_DIR, "system", "temporal.json"), {});
      const usage = readJson(join(MEMORY_DIR, "system", "usage.json"), {});
      const usageKeys = Object.keys(usage);
      const totalUses = usageKeys.reduce((a, k) => a + (usage[k]?.count || 0), 0);

      const extsOn = existsSync(join(AGENT_DIR, "extensions"))
        ? readdirSync(join(AGENT_DIR, "extensions")).filter((f) => f.endsWith(".ts")).length : 0;
      const extsOff = existsSync(join(AGENT_DIR, "extensions-disabled"))
        ? readdirSync(join(AGENT_DIR, "extensions-disabled")).filter((f) => f.endsWith(".ts")).length : 0;

      const services = ["pi-tg", "wxbot-listener", "l1-watcher"]
        .map((s) => `  ${s.padEnd(15)} ${sh(`systemctl is-active ${s}`) || "?"}`).join("\n");
      const timers = sh("systemctl list-timers --no-pager | awk '{for(i=1;i<=NF;i++) if ($i ~ /\\.timer$/) print $i}' | sort -u | tr '\n' ' '");

      let lastEval = "（无）";
      try {
        const hist = readFileSync("/root/eval/eval_history.jsonl", "utf-8")
          .trim().split("\n");
        const last = JSON.parse(hist[hist.length - 1]);
        lastEval = `hit@3 ${(last.hit3 * 100).toFixed(1)}%  MRR ${last.mrr}  (${last.phase})`;
      } catch { /* ignore */ }

      const text = [
        "🧠 小鑫 · 自我状态",
        "",
        "【记忆分布】",
        memLines,
        "",
        "【检索资产】",
        `  向量条目        ${idx.items?.length ?? 0}`,
        `  时间索引        ${Object.keys(temporal).length}（被取代 ${Object.values(temporal).filter((t: any) => t.superseded_by).length}）`,
        `  使用账本        ${usageKeys.length} 条 / 累计召回 ${totalUses} 次`,
        "",
        "【扩展】",
        `  启用 ${extsOn} / 已禁用 ${extsOff}`,
        "",
        "【服务】",
        services,
        "",
        "【定时任务】",
        timers ? timers.split("\n").map((t) => "  " + t).join("\n") : "  （未读到）",
        "",
        "【最新评测】",
        `  ${lastEval}`,
      ].join("\n");

      return { content: [{ type: "text", text }], details: { memLines, extsOn, extsOff } };
    },
  });

  // ---------------- usage_report ----------------
  pi.registerTool({
    name: "usage_report",
    label: "Usage Report",
    description: "记忆使用账本：最常被召回的记忆、以及从未被召回过的沉睡条目（冷宫候选）。",
    promptSnippet: "Show memory usage ledger: hot memories and cold ones never recalled",
    promptGuidelines: [
      "用于评估记忆库的新陈代谢：哪些条目真有价值，哪些该衰减。",
      "沉睡条目不是立即删除，而是作为降权候选。",
    ],
    parameters: {
      type: "object",
      properties: { top: { type: "number", description: "列出前 N 条（默认 10）" } },
    },
    async execute(args: any) {
      const topN = Number(args?.top) || 10;
      const usage = readJson(join(MEMORY_DIR, "system", "usage.json"), {});
      const entries = Object.entries(usage) as Array<[string, any]>;
      entries.sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0));

      const hot = entries.slice(0, topN)
        .map(([k, v]) => `  ${String(v.count).padStart(4)}×  ${k.split("/").pop()}`).join("\n") || "  （暂无）";

      // 沉睡：在向量库里但从未出现在使用账本
      const idx = readJson(join(MEMORY_DIR, "system", "vector_db", "index.json"), { items: [] });
      const seen = new Set(Object.keys(usage));
      const all: string[] = (idx.items || [])
        .map((it: any) => String(it?.metadata?.filePath || ""))
        .filter(Boolean);
      const coldSet = new Set<string>();
      for (const p of all) {
        const s = p.replace(/\\/g, "/");
        const i = s.indexOf("/memory/");
        const k = i >= 0 ? s.slice(i + 1) : s;
        if (!seen.has(k)) coldSet.add(k);
      }
      const cold = [...coldSet].slice(0, topN)
        .map((k) => `  ${k.split("/").pop()}`).join("\n") || "  （无）";

      return {
        content: [{
          type: "text",
          text: [
            `📒 记忆使用账本（共 ${entries.length} 条有记录，累计召回 ${entries.reduce((a, [, v]) => a + (v?.count || 0), 0)} 次）`,
            "",
            `🔥 最常被召回 Top${topN}:`,
            hot,
            "",
            `💤 沉睡条目（在库但从未被召回）共 ${coldSet.size} 条，示例:`,
            cold,
            "",
            "处置建议：沉睡 ≠ 删除。可用 set_memory_validity 降 confidence 到 0.6，让它们退回兜底位。",
          ].join("\n"),
        }],
        details: { hotCount: entries.length, coldCount: coldSet.size },
      };
    },
  });

  // ---------------- detect_conflicts ----------------
  pi.registerTool({
    name: "detect_conflicts",
    label: "Detect Conflicts",
    description:
      "冲突暴露：给一段新内容，检索出可能与之矛盾的既有记忆，提示复核。不做自动判定（判定需人确认），只负责把冲突摆到台面上。",
    promptSnippet: "Surface existing memories that may contradict new content",
    promptGuidelines: [
      "准备写入一条新记忆前调用，看是否已有相反结论。",
      "它只负责暴露候选，最终由人确认；确认后用 mark_superseded 建立取代链。",
    ],
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "要写入的新内容" },
        top_k: { type: "number", description: "返回候选数（默认 5）" },
      },
      required: ["content"],
    },
    async execute(args: any) {
      const text = String(args.content || "");
      const topk = Number(args.top_k) || 5;
      try {
        const svc = (await import("../../services/steel-will-semantic-retrieval.ts")).default as any;
        const rs = await svc.searchMemory(text, topk);
        const lines = rs.map((r: any, i: number) =>
          `  ${i + 1}. [${r.score.toFixed(3)}] ${r.metadata.filePath.split("/").pop()}${r.metadata.temporal ? " ⏳" + r.metadata.temporal : ""}`);
        return {
          content: [{
            type: "text",
            text: [
              "⚠️ 冲突暴露（候选，需人工复核）",
              "",
              lines.join("\n") || "  （无相似条目）",
              "",
              "若确认某条已被取代，调用 mark_superseded 建立取代链。",
            ].join("\n"),
          }],
          details: { count: rs.length },
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `冲突检测失败: ${e?.message ?? e}` }] };
      }
    },
  });
}
