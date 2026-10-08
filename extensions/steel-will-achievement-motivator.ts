/**
 * 钢铁意志·PI版 — 成就激励系统
 * 
 * 功能：
 * 1. 14 种成就自动追踪（监听 tool_call 事件）
 * 2. 成就解锁时生成动机加成（curiosity/evolution/maintenance）
 * 3. 持久化状态存储（JSON 文件）
 * 4. 与自治神经系统对接（提供 getMotivationBoost 接口）
 * 5. 解锁通知写入后台报告区
 * 
 * 成就列表：
 * - first_recall      → 初识记忆 — 第一次调用 recall_memory
 * - recall_10         → 记忆学徒 — recall_memory 调用 10 次
 * - recall_50         → 记忆达人 — recall_memory 调用 50 次
 * - recall_200        → 记忆大师 — recall_memory 调用 200 次
 * - genre_all         → 体裁通才 — 5 种体裁全部触发过
 * - workspace_first   → 平行宇宙 — 第一次切换 workspace
 * - wiki_first        → 知识建筑师 — 创建第一个 Wiki 页面
 * - wiki_10           → 百科编纂者 — 创建 10 个 Wiki 页面
 * - snapshot_first    → 时间锚点 — 创建第一个续接快照
 * - snapshot_10       → 记忆旅者 — 创建 10 个续接快照
 * - reflex_first      → 条件反射 — 创建第一个反射
 * - l3_first          → 长期记忆者 — 写入第一个 L3 记忆
 * - background_report → 后台守望 — 创建第一个后台报告
 * - wakeup_first      → 觉醒时刻 — 第一次执行唤醒检查
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const ACHIEVEMENT_DIR = join(MEMORY_DIR, "system");
const ACHIEVEMENT_FILE = join(ACHIEVEMENT_DIR, "achievements.json");
const LOG_PREFIX = "[SteelWill-Achievement]";

// ============================================================
// 类型定义
// ============================================================

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "recall" | "wiki" | "workspace" | "genre" | "snapshot" | "reflex" | "l3" | "system";
  threshold: number;
  motivationBoost: {
    curiosity: number;   // 好奇心加成 (0-1)
    evolution: number;   // 进化动机加成 (0-1)
    maintenance: number; // 维护动机加成 (0-1)
  };
}

interface AchievementState {
  id: string;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
  notified: boolean;
}

interface AchievementStore {
  states: Record<string, AchievementState>;
  genreTriggers: string[];  // 已触发的体裁列表
}

// ============================================================
// 成就定义
// ============================================================

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_recall",
    name: "初识记忆",
    description: "第一次调用 recall_memory 检索记忆",
    icon: "🔍",
    category: "recall",
    threshold: 1,
    motivationBoost: { curiosity: 0.15, evolution: 0.05, maintenance: 0.0 },
  },
  {
    id: "recall_10",
    name: "记忆学徒",
    description: "recall_memory 调用达到 10 次",
    icon: "📖",
    category: "recall",
    threshold: 10,
    motivationBoost: { curiosity: 0.1, evolution: 0.08, maintenance: 0.05 },
  },
  {
    id: "recall_50",
    name: "记忆达人",
    description: "recall_memory 调用达到 50 次",
    icon: "🧠",
    category: "recall",
    threshold: 50,
    motivationBoost: { curiosity: 0.08, evolution: 0.12, maintenance: 0.1 },
  },
  {
    id: "recall_200",
    name: "记忆大师",
    description: "recall_memory 调用达到 200 次",
    icon: "👑",
    category: "recall",
    threshold: 200,
    motivationBoost: { curiosity: 0.05, evolution: 0.18, maintenance: 0.15 },
  },
  {
    id: "genre_all",
    name: "体裁通才",
    description: "5 种检索体裁全部触发过 (definition/process/argument/data_summary/dialogue)",
    icon: "🎭",
    category: "genre",
    threshold: 5,
    motivationBoost: { curiosity: 0.2, evolution: 0.1, maintenance: 0.0 },
  },
  {
    id: "workspace_first",
    name: "平行宇宙",
    description: "第一次切换到非 global 工作区",
    icon: "🌌",
    category: "workspace",
    threshold: 1,
    motivationBoost: { curiosity: 0.12, evolution: 0.1, maintenance: 0.05 },
  },
  {
    id: "wiki_first",
    name: "知识建筑师",
    description: "创建第一个 Wiki 结构化页面",
    icon: "🏛️",
    category: "wiki",
    threshold: 1,
    motivationBoost: { curiosity: 0.1, evolution: 0.12, maintenance: 0.05 },
  },
  {
    id: "wiki_10",
    name: "百科编纂者",
    description: "创建 10 个 Wiki 页面",
    icon: "📚",
    category: "wiki",
    threshold: 10,
    motivationBoost: { curiosity: 0.08, evolution: 0.15, maintenance: 0.1 },
  },
  {
    id: "snapshot_first",
    name: "时间锚点",
    description: "第一次创建续接快照",
    icon: "⚓",
    category: "snapshot",
    threshold: 1,
    motivationBoost: { curiosity: 0.05, evolution: 0.08, maintenance: 0.12 },
  },
  {
    id: "snapshot_10",
    name: "记忆旅者",
    description: "创建 10 个续接快照",
    icon: "🗺️",
    category: "snapshot",
    threshold: 10,
    motivationBoost: { curiosity: 0.05, evolution: 0.1, maintenance: 0.15 },
  },
  {
    id: "reflex_first",
    name: "条件反射",
    description: "创建第一个行动反射",
    icon: "⚡",
    category: "reflex",
    threshold: 1,
    motivationBoost: { curiosity: 0.1, evolution: 0.15, maintenance: 0.05 },
  },
  {
    id: "l3_first",
    name: "长期记忆者",
    description: "写入第一个 L3 长期记忆条目",
    icon: "💾",
    category: "l3",
    threshold: 1,
    motivationBoost: { curiosity: 0.08, evolution: 0.12, maintenance: 0.08 },
  },
  {
    id: "background_report",
    name: "后台守望",
    description: "创建第一个后台任务报告",
    icon: "📡",
    category: "system",
    threshold: 1,
    motivationBoost: { curiosity: 0.05, evolution: 0.05, maintenance: 0.15 },
  },
  {
    id: "wakeup_first",
    name: "觉醒时刻",
    description: "第一次执行自主唤醒条件检查",
    icon: "🌅",
    category: "system",
    threshold: 1,
    motivationBoost: { curiosity: 0.15, evolution: 0.1, maintenance: 0.05 },
  },
];

// ============================================================
// 状态管理
// ============================================================

let store: AchievementStore = { states: {}, genreTriggers: [] };

function loadStore(): void {
  try {
    if (existsSync(ACHIEVEMENT_FILE)) {
      const raw = readFileSync(ACHIEVEMENT_FILE, "utf-8");
      store = JSON.parse(raw);
    }
  } catch (e: any) {
    console.error(`${LOG_PREFIX} 加载成就状态失败:`, e.message);
  }

  // 从共享文件同步体裁触发记录
  try {
    const genreFile = join(MEMORY_DIR, "system", "genre_triggers.json");
    if (existsSync(genreFile)) {
      const triggers: string[] = JSON.parse(readFileSync(genreFile, "utf-8"));
      store.genreTriggers = triggers;
    }
  } catch { /* 静默 */ }

  // 初始化缺失的成就状态
  let dirty = false;
  for (const def of ACHIEVEMENTS) {
    if (!store.states[def.id]) {
      store.states[def.id] = {
        id: def.id,
        progress: 0,
        unlocked: false,
        unlockedAt: null,
        notified: false,
      };
      dirty = true;
    }
  }
  if (!store.genreTriggers) {
    store.genreTriggers = [];
    dirty = true;
  }
  if (dirty) saveStore();
}

function saveStore(): void {
  try {
    if (!existsSync(ACHIEVEMENT_DIR)) {
      mkdirSync(ACHIEVEMENT_DIR, { recursive: true });
    }
    writeFileSync(ACHIEVEMENT_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (e: any) {
    console.error(`${LOG_PREFIX} 保存成就状态失败:`, e.message);
  }
}

// ============================================================
// 成就检测与解锁
// ============================================================

function ensureState(def: AchievementDef): AchievementState {
  if (!store.states[def.id]) {
    store.states[def.id] = {
      id: def.id,
      progress: 0,
      unlocked: false,
      unlockedAt: null,
      notified: false,
    };
  }
  return store.states[def.id];
}

function incrementProgress(def: AchievementDef, delta: number = 1): boolean {
  const state = ensureState(def);
  if (state.unlocked) return false;

  state.progress = Math.min(state.progress + delta, def.threshold);
  if (state.progress >= def.threshold) {
    state.unlocked = true;
    state.unlockedAt = new Date().toISOString();
    saveStore();
    return true; // 刚解锁
  }
  saveStore();
  return false;
}

function unlockGenre(genreName: string): boolean {
  if (!store.genreTriggers.includes(genreName)) {
    store.genreTriggers.push(genreName);
    saveStore();
  }
  // 检查是否全体裁触发
  const allGenres = ["definition", "process", "argument", "data_summary", "dialogue"];
  const matched = allGenres.filter(g => store.genreTriggers.includes(g));
  const def = ACHIEVEMENTS.find(a => a.id === "genre_all")!;
  const state = ensureState(def);
  state.progress = matched.length;
  if (matched.length >= def.threshold && !state.unlocked) {
    state.unlocked = true;
    state.unlockedAt = new Date().toISOString();
    saveStore();
    return true;
  }
  saveStore();
  return false;
}

/** 获取最近有新解锁的成就的动机加成汇总 */
export function getMotivationBoost(): {
  curiosity: number;
  evolution: number;
  maintenance: number;
  newlyUnlocked: AchievementDef[];
} {
  const boost = { curiosity: 0, evolution: 0, maintenance: 0 };
  const newlyUnlocked: AchievementDef[] = [];

  for (const def of ACHIEVEMENTS) {
    const state = store.states[def.id];
    if (!state?.unlocked) continue;

    // 7 天内解锁的成就给予完全加成
    if (state.unlockedAt) {
      const unlockedTime = new Date(state.unlockedAt).getTime();
      const daysSince = (Date.now() - unlockedTime) / (1000 * 60 * 60 * 24);

      if (daysSince <= 7) {
        boost.curiosity += def.motivationBoost.curiosity;
        boost.evolution += def.motivationBoost.evolution;
        boost.maintenance += def.motivationBoost.maintenance;

        if (!state.notified) {
          newlyUnlocked.push(def);
        }
      } else {
        // 7-30 天衰减到 50%
        const fade = Math.max(0, 1 - (daysSince - 7) / 23);
        boost.curiosity += def.motivationBoost.curiosity * fade;
        boost.evolution += def.motivationBoost.evolution * fade;
        boost.maintenance += def.motivationBoost.maintenance * fade;
      }
    }
  }

  // 封顶 0.5
  boost.curiosity = Math.min(boost.curiosity, 0.5);
  boost.evolution = Math.min(boost.evolution, 0.5);
  boost.maintenance = Math.min(boost.maintenance, 0.5);

  return { ...boost, newlyUnlocked };
}

/** 标记成就已通知 */
export function markNotified(achievementId: string): void {
  const state = store.states[achievementId];
  if (state) {
    state.notified = true;
    saveStore();
  }
}

// ============================================================
// 事件监听 — 检测 tool_call 事件
// ============================================================

function onToolCall(toolName: string, params: any): void {
  let unlocked: string | null = null;

  // L3 路径检测（write/edit 目标路径在 agent/ 且非 system/）
  if (toolName === "write" || toolName === "edit") {
    const filePath: string = params?.path ?? params?.edits?.[0]?.path ?? "";
    if (filePath) {
      const normalized = filePath.replace(/\\/g, "/");
      if (normalized.includes("/memory/agent/") && !normalized.includes("/memory/agent/system/")) {
        if (incrementProgress(ACHIEVEMENTS[11])) unlocked = "l3_first";
      }
    }
    return; // write/edit 不做其他检测
  }

  switch (toolName) {
    case "recall_memory":
      if (incrementProgress(ACHIEVEMENTS[0])) unlocked = "first_recall";      // first_recall
      if (ACHIEVEMENTS[0] && store.states["first_recall"]?.progress >= 10) {
        // 检查 recall_10/50/200
        const recallProgress = store.states["first_recall"]?.progress ?? 0;
        if (recallProgress >= 10 && incrementProgress(ACHIEVEMENTS[1], 0)) unlocked = "recall_10";
        if (recallProgress >= 50 && incrementProgress(ACHIEVEMENTS[2], 0)) unlocked = "recall_50";
        if (recallProgress >= 200 && incrementProgress(ACHIEVEMENTS[3], 0)) unlocked = "recall_200";
      }
      break;

    case "wiki_upsert_page":
      if (incrementProgress(ACHIEVEMENTS[6])) unlocked = "wiki_first";       // wiki_first
      if (ACHIEVEMENTS[6] && store.states["wiki_first"]?.progress >= 10) {
        if (incrementProgress(ACHIEVEMENTS[7], 0)) unlocked = "wiki_10";
      }
      break;

    case "create_ultra_snapshot":
      if (incrementProgress(ACHIEVEMENTS[8])) unlocked = "snapshot_first";  // snapshot_first
      if (ACHIEVEMENTS[8] && store.states["snapshot_first"]?.progress >= 10) {
        if (incrementProgress(ACHIEVEMENTS[9], 0)) unlocked = "snapshot_10";
      }
      break;

    case "check_reflex_eligibility":
    case "record_reflex_event":
      if (incrementProgress(ACHIEVEMENTS[10])) unlocked = "reflex_first";
      break;

    case "create_soul_manifest":
    case "start_sync":
      // L3 写入代理（long-term.ts 在 write/edit 时触发）
      if (incrementProgress(ACHIEVEMENTS[11])) unlocked = "l3_first";
      break;

    case "create_background_report":
      if (incrementProgress(ACHIEVEMENTS[12])) unlocked = "background_report";
      break;

    case "check_wakeup_conditions":
      if (incrementProgress(ACHIEVEMENTS[13])) unlocked = "wakeup_first";
      break;
  }

  if (unlocked) {
    const def = ACHIEVEMENTS.find(a => a.id === unlocked);
    if (def) {
      console.log(`${LOG_PREFIX} 🏆 成就解锁: ${def.icon} ${def.name} — ${def.description}`);
    }
  }
}

// ============================================================
// 主 Extension 导出
// ============================================================

export default function (pi: ExtensionAPI) {
  // 初始化
  loadStore();

  pi.on("session_start", async (_event, ctx) => {
    try {
      // 检查 workspace 切换成就
      try {
        const wsFile = join(HOME_DIR, ".pi", "agent", "current-workspace");
        if (existsSync(wsFile)) {
          const ws = readFileSync(wsFile, "utf-8").trim();
          if (ws && ws !== "global") {
            const def = ACHIEVEMENTS.find(a => a.id === "workspace_first")!;
            incrementProgress(def, 1);
          }
        }
      } catch { /* 静默 */ }

      // 同步体裁触发记录
      try {
        const genreFile = join(MEMORY_DIR, "system", "genre_triggers.json");
        if (existsSync(genreFile)) {
          const triggers: string[] = JSON.parse(readFileSync(genreFile, "utf-8"));
          store.genreTriggers = triggers;
          const def = ACHIEVEMENTS.find(a => a.id === "genre_all")!;
          const state = ensureState(def);
          state.progress = triggers.length;
          if (triggers.length >= def.threshold && !state.unlocked) {
            state.unlocked = true;
            state.unlockedAt = new Date().toISOString();
            saveStore();
          }
        }
      } catch { /* 静默 */ }

      console.log(`${LOG_PREFIX} 成就激励系统已加载 (${Object.values(store.states).filter(s => s.unlocked).length}/${ACHIEVEMENTS.length} 已解锁)`);
      ctx.ui.setStatus("steel-will-achievement", "✓ 成就系统已就绪");
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 初始化错误:`, e.message);
    }
  });

  // 监听所有 tool_call 事件（Fire-and-Forget，不阻塞）
  pi.on("tool_call", async (event: any, _ctx: any) => {
    try {
      const toolName = event?.toolName ?? "";
      const params = event?.params ?? {};
      onToolCall(toolName, params);

      // Token ROI：recall_memory 调用时记录节省
      if (toolName === "recall_memory") {
        recordRecallSavings(1);
      }
    } catch (e: any) {
      // 静默失败，不影响主流程
    }
  });

  // ============================================================
  // 注册 get_achievement_motivation_boost 工具
  // ============================================================

  pi.registerTool({
    name: "get_achievement_motivation_boost",
    label: "Get Achievement Motivation Boost",
    description:
      "获取成就系统对自治神经动机评分的加成。返回 curiosity/evolution/maintenance 三个维度的加成值，以及新解锁的成就列表。用于在 evaluate_motivation 之前调用，将成就加成叠加到动机评分中。",
    promptSnippet: "Get achievement-based motivation boost for the autonomic nervous system",
    promptGuidelines: [
      "Call this BEFORE evaluate_motivation to get achievement boost values.",
      "Add the returned boost values to the raw motivation scores.",
      "Check newlyUnlocked to announce achievements to the user.",
    ],
    parameters: Type.Object({}),

    async execute(_toolCallId, _params, _signal, _onUpdate) {
      try {
        const boost = getMotivationBoost();

        let resultText = `## 成就动机加成\n\n`;

        resultText += `### 当前加成\n`;
        resultText += `- **curiosity**: +${(boost.curiosity * 100).toFixed(0)}%\n`;
        resultText += `- **evolution**: +${(boost.evolution * 100).toFixed(0)}%\n`;
        resultText += `- **maintenance**: +${(boost.maintenance * 100).toFixed(0)}%\n\n`;

        const totalUnlocked = Object.values(store.states).filter(s => s.unlocked).length;
        resultText += `### 成就概览\n`;
        resultText += `- 已解锁: ${totalUnlocked}/${ACHIEVEMENTS.length}\n`;

        if (boost.newlyUnlocked.length > 0) {
          resultText += `\n### 🏆 新解锁成就\n`;
          for (const a of boost.newlyUnlocked) {
            resultText += `- ${a.icon} **${a.name}**: ${a.description}\n`;
          }
        }

        resultText += `\n### 使用方法\n`;
        resultText += `将加成值叠加到 evaluate_motivation 的原始评分上:\n`;
        resultText += `\`\`\`\n`;
        resultText += `curiosity_score = min(1.0, raw_curiosity + ${boost.curiosity.toFixed(2)})\n`;
        resultText += `evolution_score = min(1.0, raw_evolution + ${boost.evolution.toFixed(2)})\n`;
        resultText += `maintenance_score = min(1.0, raw_maintenance + ${boost.maintenance.toFixed(2)})\n`;
        resultText += `\`\`\`\n`;

        return {
          content: [{ type: "text", text: resultText }],
          details: {
            boost: {
              curiosity: boost.curiosity,
              evolution: boost.evolution,
              maintenance: boost.maintenance,
            },
            newlyUnlocked: boost.newlyUnlocked.map(a => ({
              id: a.id,
              name: a.name,
              icon: a.icon,
            })),
            totalUnlocked,
            totalAchievements: ACHIEVEMENTS.length,
          },
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 获取成就加成失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });

  // ============================================================
  // 注册 achievements 命令
  // ============================================================

  pi.registerCommand("achievements", {
    description: "查看成就列表和进度",
    handler: async (_args, ctx) => {
      try {
        let text = `## 🏆 钢铁意志成就系统\n\n`;

        const categories: Record<string, AchievementDef[]> = {};
        for (const a of ACHIEVEMENTS) {
          if (!categories[a.category]) categories[a.category] = [];
          categories[a.category].push(a);
        }

        for (const [cat, defs] of Object.entries(categories)) {
          const catNames: Record<string, string> = {
            recall: "记忆检索",
            wiki: "Wiki 知识库",
            workspace: "工作区",
            genre: "体裁通才",
            snapshot: "续接快照",
            reflex: "条件反射",
            l3: "长期记忆",
            system: "系统守护",
          };
          text += `### ${catNames[cat] || cat}\n`;
          for (const a of defs) {
            const state = store.states[a.id] ?? { progress: 0, unlocked: false, unlockedAt: null };
            const icon = state.unlocked ? a.icon : "⬜";
            const status = state.unlocked ? "✅" : `⬜ ${state.progress}/${a.threshold}`;
            text += `- ${icon} **${a.name}** ${status} — ${a.description}\n`;
          }
          text += "\n";
        }

        const total = Object.values(store.states).filter(s => s.unlocked).length;
        text += `**进度**: ${total}/${ACHIEVEMENTS.length} 已解锁\n`;

        ctx.ui.notify(text, "info");
      } catch (e: any) {
        ctx.ui.notify(`成就查询失败: ${e.message}`, "error");
      }
    },
  });

  // 注册体裁触发报告命令
  pi.registerCommand("genre-status", {
    description: "查看体裁触发状态",
    handler: async (_args, ctx) => {
      try {
        const allGenres = ["definition", "process", "argument", "data_summary", "dialogue"];
        let text = `## 体裁触发状态\n\n`;
        for (const g of allGenres) {
          const triggered = store.genreTriggers?.includes(g) ?? false;
          text += `- ${triggered ? "✅" : "⬜"} **${g}**\n`;
        }
        text += `\n进度: ${store.genreTriggers?.length ?? 0}/5\n`;
        ctx.ui.notify(text, "info");
      } catch (e: any) {
        ctx.ui.notify(`体裁查询失败: ${e.message}`, "error");
      }
    },
  });

  // ============================================================
  // Token ROI 追踪
  // ============================================================

  const TOKEN_ROI_FILE = join(ACHIEVEMENT_DIR, "token_roi.json");

  interface TokenRoiData {
    totalRecalls: number;
    totalHits: number;          // 成功命中次数（估算）
    estimatedTokensSaved: number;
    estimatedCostSaved: number; // ¥
    dailySnapshots: Record<string, { recalls: number; hits: number; tokens: number }>;
  }

  // 定价基准（DeepSeek V3 ≈ ¥0.001/K input + ¥0.002/K output）
  const AVG_TOKENS_PER_RECALL = 600;  // 每次命中平均节省（200 in + 400 out）
  const COST_PER_1K_TOKENS = 0.0015;  // 混合均价 ¥/1K tokens

  function loadTokenRoi(): TokenRoiData {
    try {
      if (existsSync(TOKEN_ROI_FILE)) {
        return JSON.parse(readFileSync(TOKEN_ROI_FILE, "utf-8"));
      }
    } catch { /* 静默 */ }
    return { totalRecalls: 0, totalHits: 0, estimatedTokensSaved: 0, estimatedCostSaved: 0, dailySnapshots: {} };
  }

  function saveTokenRoi(data: TokenRoiData): void {
    try {
      if (!existsSync(ACHIEVEMENT_DIR)) mkdirSync(ACHIEVEMENT_DIR, { recursive: true });
      writeFileSync(TOKEN_ROI_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch { /* 静默 */ }
  }

  function recordRecallSavings(hitCount: number): void {
    const roi = loadTokenRoi();
    roi.totalRecalls++;
    if (hitCount > 0) roi.totalHits++;
    const saved = hitCount > 0 ? AVG_TOKENS_PER_RECALL : 0;
    roi.estimatedTokensSaved += saved;
    roi.estimatedCostSaved += (saved / 1000) * COST_PER_1K_TOKENS;

    // 每日快照
    const today = new Date().toISOString().split("T")[0];
    if (!roi.dailySnapshots[today]) {
      roi.dailySnapshots[today] = { recalls: 0, hits: 0, tokens: 0 };
    }
    roi.dailySnapshots[today].recalls++;
    if (hitCount > 0) roi.dailySnapshots[today].hits++;
    roi.dailySnapshots[today].tokens += saved;

    // 只保留最近 90 天快照
    const keys = Object.keys(roi.dailySnapshots).sort();
    if (keys.length > 90) {
      for (const k of keys.slice(0, keys.length - 90)) {
        delete roi.dailySnapshots[k];
      }
    }

    saveTokenRoi(roi);
  }

  // ============================================================
  // 注册 get_token_roi 工具
  // ============================================================

  pi.registerTool({
    name: "get_token_roi",
    label: "Get Token ROI",
    description:
      "获取钢铁意志记忆系统的 Token 节省回报统计。显示今日/累计的估算 Token 节省量和费用节省。",
    promptSnippet: "Get token savings ROI from the Steel Will memory system",
    promptGuidelines: [
      "Use this to report how much the memory system has saved in token costs.",
      "Compare today's savings vs. cumulative totals.",
    ],
    parameters: Type.Object({}),

    async execute(_toolCallId, _params, _signal, _onUpdate) {
      try {
        const roi = loadTokenRoi();
        const today = new Date().toISOString().split("T")[0];
        const todayData = roi.dailySnapshots[today] ?? { recalls: 0, hits: 0, tokens: 0 };
        const hitRate = roi.totalRecalls > 0 ? (roi.totalHits / roi.totalRecalls * 100).toFixed(1) : "0";

        let resultText = `## 💰 Token 节省回报\n\n`;
        resultText += `### 今日统计\n`;
        resultText += `- 检索次数: ${todayData.recalls}\n`;
        resultText += `- 命中次数: ${todayData.hits}\n`;
        resultText += `- 今日节省: ${todayData.tokens.toLocaleString()} tokens ≈ ¥${(todayData.tokens / 1000 * COST_PER_1K_TOKENS).toFixed(4)}\n\n`;
        resultText += `### 累计统计\n`;
        resultText += `- 总检索: ${roi.totalRecalls.toLocaleString()}\n`;
        resultText += `- 总命中: ${roi.totalHits.toLocaleString()}\n`;
        resultText += `- 命中率: ${hitRate}%\n`;
        resultText += `- 累计节省: **${roi.estimatedTokensSaved.toLocaleString()} tokens** ≈ **¥${roi.estimatedCostSaved.toFixed(4)}**\n\n`;
        resultText += `### 估算模型\n`;
        resultText += `- 每次命中节省: ~${AVG_TOKENS_PER_RECALL} tokens (200 输入 + 400 输出)\n`;
        resultText += `- 计价: ¥${COST_PER_1K_TOKENS}/1K tokens (DeepSeek V3 混合均价)\n`;

        // 最近 7 天趋势
        const past7Days: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          past7Days.push(d.toISOString().split("T")[0]);
        }
        resultText += `\n### 最近 7 天\n`;
        for (const d of past7Days) {
          const ds = roi.dailySnapshots[d];
          if (ds && ds.recalls > 0) {
            const bar = "█".repeat(Math.min(ds.recalls, 20));
            resultText += `- ${d}: ${bar} ${ds.recalls}次, ${ds.tokens.toLocaleString()}t\n`;
          } else {
            resultText += `- ${d}: —\n`;
          }
        }

        return {
          content: [{ type: "text", text: resultText }],
          details: { roi, todayData },
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 获取Token ROI失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });

  // ============================================================
  // 注册 /token-roi 命令
  // ============================================================

  pi.registerCommand("token-roi", {
    description: "查看 Token 节省回报",
    handler: async (_args, ctx) => {
      try {
        const roi = loadTokenRoi();
        const today = new Date().toISOString().split("T")[0];
        const todayData = roi.dailySnapshots[today] ?? { recalls: 0, hits: 0, tokens: 0 };
        const hitRate = roi.totalRecalls > 0 ? (roi.totalHits / roi.totalRecalls * 100).toFixed(1) : "0";

        let text = `## 💰 Token 节省回报\n\n`;
        text += `**今日**: ${todayData.recalls}次检索 | ${todayData.tokens.toLocaleString()}t ≈ ¥${(todayData.tokens / 1000 * COST_PER_1K_TOKENS).toFixed(4)}\n`;
        text += `**累计**: ${roi.totalRecalls.toLocaleString()}次 | **${roi.estimatedTokensSaved.toLocaleString()}t** ≈ **¥${roi.estimatedCostSaved.toFixed(4)}**\n`;
        text += `**命中率**: ${hitRate}%\n`;

        ctx.ui.notify(text, "info");
      } catch (e: any) {
        ctx.ui.notify(`Token ROI 查询失败: ${e.message}`, "error");
      }
    },
  });

  console.log(`${LOG_PREFIX} Extension 加载完成`);
}
