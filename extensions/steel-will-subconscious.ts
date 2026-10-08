/**
 * 钢铁意志·PI版 - 包26：自发式编排与动态重规划算力栈
 * 
 * 正式包名：26 -【钢铁意志·PI版】- 自发式编排与动态重规划算力栈
 * 通俗功能：潜意识增强链、反射路由、慢链下沉
 * 技术别名：Steel Will Subconscious & Reflex Router
 * 
 * 架构设计：
 * - 反射路由：低风险高频动作快速接管
 * - 反射编译：慢思考链动作下沉到快链
 * - 反射账本：命中、miss、降级记录
 * - 失败退主链：反射失败无损退回主链
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from "fs";
import { join } from "path";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const SUBCONSCIOUS_DIR = join(MEMORY_DIR, "system", "subconscious");
const LEDGER_PATH = join(SUBCONSCIOUS_DIR, "reflex_event_ledger.jsonl");
const LOG_PREFIX = "[SteelWill-Subconscious]";

// ============================================================
// 反射状态定义
// ============================================================

type ReflexState = "observed" | "candidate" | "compilable" | "active" | "cooldown" | "retired";

interface ReflexEntry {
  id: string;
  name: string;
  state: ReflexState;
  risk_level: "low" | "medium" | "high";
  success_count: number;
  fail_count: number;
  last_triggered: string;
  cooldown_until?: string;
}

// ============================================================
// 反射事件定义
// ============================================================

type ReflexEventType = "hit" | "miss" | "blocked" | "fallback" | "retired";

interface ReflexEvent {
  at: string;
  reflex_id: string;
  event_type: ReflexEventType;
  context: string;
  reason?: string;
}

// ============================================================
// 主 Extension 导出
// ============================================================

const EXPOSE_DIAGNOSTIC_TOOLS = false; // 2026-10-07 摘工具（改 true + 重开会话即恢复）

export default function (pi: ExtensionAPI) {
  
  // 会话开始时初始化
  pi.on("session_start", async (_event, ctx) => {
    try {
      // 确保目录存在
      if (!existsSync(SUBCONSCIOUS_DIR)) {
        mkdirSync(SUBCONSCIOUS_DIR, { recursive: true });
      }
      
      console.log(`${LOG_PREFIX} 潜意识模块已加载`);
      ctx.ui.setStatus("steel-will-subconscious", "✓ 潜意识已就绪");
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 初始化错误:`, e.message);
    }
  });
  
  // ============================================================
  // 注册 check_reflex_eligibility 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "check_reflex_eligibility",
    label: "Check Reflex Eligibility",
    description: "检查动作是否符合反射条件：低风险、高频、已验证。只有符合条件的动作才能进入反射区。",
    promptSnippet: "Check if action qualifies for reflex",
    parameters: Type.Object({
      action: Type.String({ description: "动作描述" }),
      risk_level: Type.String({ description: "风险等级：low/medium/high" }),
      frequency: Type.Number({ description: "历史执行频次" }),
      success_rate: Type.Number({ description: "成功率 (0-1)" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { action, risk_level, frequency, success_rate } = params;
      
      console.log(`${LOG_PREFIX} 检查反射资格: ${action}`);
      
      try {
        let eligible = false;
        let reason = "";
        let state: ReflexState = "observed";
        
        // 反射资格检查
        if (risk_level !== "low") {
          eligible = false;
          reason = "风险等级不是low，不允许进入反射区";
          state = "observed";
        } else if (frequency < 5) {
          eligible = false;
          reason = "执行频次不足5次，继续观察";
          state = "observed";
        } else if (success_rate < 0.8) {
          eligible = false;
          reason = "成功率不足80%，继续观察";
          state = "candidate";
        } else {
          eligible = true;
          reason = "符合条件：低风险、高频、高成功率";
          state = "compilable";
        }
        
        let resultText = `## 反射资格检查\n\n`;
        resultText += `**动作**: ${action}\n`;
        resultText += `**风险等级**: ${risk_level}\n`;
        resultText += `**执行频次**: ${frequency}\n`;
        resultText += `**成功率**: ${(success_rate * 100).toFixed(1)}%\n\n`;
        resultText += `### 检查结果\n`;
        resultText += `**符合条件**: ${eligible ? "✅ 是" : "❌ 否"}\n`;
        resultText += `**状态**: ${state}\n`;
        resultText += `**原因**: ${reason}\n\n`;
        
        if (eligible) {
          resultText += `### 建议\n`;
          resultText += `- 可进入反射编译\n`;
          resultText += `- 添加到反射候选池\n`;
          resultText += `- 监控后续执行情况\n`;
        } else {
          resultText += `### 建议\n`;
          resultText += `- 继续在主链执行\n`;
          resultText += `- 收集更多执行数据\n`;
          resultText += `- 等待满足条件\n`;
        }
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { eligible, state, reason },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 反射资格检查失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册 record_reflex_event 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "record_reflex_event",
    label: "Record Reflex Event",
    description: "记录反射事件到账本，包括命中、miss、降级、退回等事件。",
    promptSnippet: "Record reflex event to ledger",
    parameters: Type.Object({
      reflex_id: Type.String({ description: "反射ID" }),
      event_type: Type.String({ description: "事件类型：hit/miss/blocked/fallback/retired" }),
      context: Type.String({ description: "事件上下文" }),
      reason: Type.Optional(Type.String({ description: "事件原因" })),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { reflex_id, event_type, context, reason } = params;
      
      console.log(`${LOG_PREFIX} 记录反射事件: ${reflex_id} - ${event_type}`);
      
      try {
        // 创建事件条目
        const event: ReflexEvent = {
          at: new Date().toISOString(),
          reflex_id,
          event_type: event_type as ReflexEventType,
          context,
          reason,
        };
        
        // 确保目录存在
        if (!existsSync(SUBCONSCIOUS_DIR)) {
          mkdirSync(SUBCONSCIOUS_DIR, { recursive: true });
        }
        
        // 追加到账本
        appendFileSync(LEDGER_PATH, JSON.stringify(event) + "\n", "utf-8");
        
        let resultText = `## 反射事件已记录\n\n`;
        resultText += `**时间**: ${event.at}\n`;
        resultText += `**反射ID**: ${reflex_id}\n`;
        resultText += `**事件类型**: ${event_type}\n`;
        resultText += `**上下文**: ${context}\n`;
        if (reason) {
          resultText += `**原因**: ${reason}\n`;
        }
        resultText += `\n事件已追加到账本: ${LEDGER_PATH}\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { event },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 记录反射事件失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册 check_reflex_status 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "check_reflex_status",
    label: "Check Reflex Status",
    description: "检查反射区状态，包括活跃反射数量、冷却中反射、退役反射等。",
    promptSnippet: "Check reflex zone status",
    parameters: Type.Object({}),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      console.log(`${LOG_PREFIX} 检查反射区状态`);
      
      try {
        // 读取反射矩阵
        const matrixPath = join(SUBCONSCIOUS_DIR, "reflex_arc_matrix.json");
        let reflexes: ReflexEntry[] = [];
        
        if (existsSync(matrixPath)) {
          const data = JSON.parse(readFileSync(matrixPath, "utf-8"));
          reflexes = data.reflex_arcs || [];
        }
        
        // 统计各状态数量
        const stats = {
          observed: 0,
          candidate: 0,
          compilable: 0,
          active: 0,
          cooldown: 0,
          retired: 0,
        };
        
        for (const reflex of reflexes) {
          stats[reflex.state]++;
        }
        
        let resultText = `## 反射区状态\n\n`;
        resultText += `**总反射数**: ${reflexes.length}\n\n`;
        resultText += `### 状态分布\n`;
        resultText += `- 观察中 (observed): ${stats.observed}\n`;
        resultText += `- 候选 (candidate): ${stats.candidate}\n`;
        resultText += `- 可编译 (compilable): ${stats.compilable}\n`;
        resultText += `- 活跃 (active): ${stats.active}\n`;
        resultText += `- 冷却中 (cooldown): ${stats.cooldown}\n`;
        resultText += `- 已退役 (retired): ${stats.retired}\n\n`;
        
        if (stats.active > 0) {
          resultText += `### 活跃反射\n`;
          reflexes.filter(r => r.state === "active").forEach(r => {
            {
          // 修复：无事件样本时 success_count/(success+fail) = 0/0 → NaN。
          // 回退到档案里记录的先验成功率，再不行显示「暂无样本」。
          const _tot = (r.success_count || 0) + (r.fail_count || 0);
          const _rate = _tot > 0
            ? (r.success_count / _tot) * 100
            : (typeof r.success_rate === "number" ? r.success_rate * 100 : null);
          const _txt = _rate === null ? "暂无样本" : `${_rate.toFixed(1)}%`;
          resultText += `- ${r.name} (成功率: ${_txt})\n`;
        }
          });
        }
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { stats, reflexes },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 检查反射区状态失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册辅助命令
  // ============================================================
  
  pi.registerCommand("subconscious-status", {
    description: "查看潜意识模块状态",
    handler: async (_args, ctx) => {
      try {
        let statusText = `## 潜意识模块状态\n\n`;
        statusText += `- **模块加载**: ✓ 已加载\n`;
        statusText += `- **反射路由**: ✓ 可用\n`;
        statusText += `- **反射编译**: ✓ 可用\n`;
        statusText += `- **反射账本**: ✓ 可用\n\n`;
        statusText += `### 已注册工具\n`;
        statusText += `- check_reflex_eligibility: 检查反射资格\n`;
        statusText += `- record_reflex_event: 记录反射事件\n`;
        statusText += `- check_reflex_status: 检查反射区状态\n`;
        
        ctx.ui.notify(statusText, "info");
      } catch (e: any) {
        ctx.ui.notify(`状态查询失败: ${e.message}`, "error");
      }
    },
  });
  
  console.log(`${LOG_PREFIX} Extension 加载完成，潜意识模块已注册`);
}
