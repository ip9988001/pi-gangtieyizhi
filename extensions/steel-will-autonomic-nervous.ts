/**
 * 钢铁意志·PI版 - 包27：认知过载抑制与动态Token压榨微调
 * 
 * 正式包名：27 -【钢铁意志·PI版】- 认知过载抑制与动态Token压榨微调
 * 通俗功能：自主唤醒增强、动机评分、Token压榨
 * 技术别名：Steel Will Autonomic Nervous System
 * 
 * 架构设计：
 * - 守护进程：静默期保守唤醒
 * - 动机评分：maintenance/evolution/curiosity
 * - 内部独白：后台任务输出
 * - 用户回归抢占：优雅中断汇报
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const AUTONOMIC_DIR = join(MEMORY_DIR, "system", "autonomic_nervous");
const LOG_PREFIX = "[SteelWill-AutonomicNervous]";

// ============================================================
// 动机类型定义
// ============================================================

type MotivationType = "maintenance" | "evolution" | "curiosity";

interface MotivationScore {
  type: MotivationType;
  score: number;
  reason: string;
}

// ============================================================
// 唤醒条件定义
// ============================================================

interface WakeupConditions {
  budget_available: boolean;
  silent_period: boolean;
  host_load_low: boolean;
  safety_threshold: boolean;
}

// ============================================================
// 主 Extension 导出
// ============================================================

export default function (pi: ExtensionAPI) {
  
  // 会话开始时初始化
  pi.on("session_start", async (_event, ctx) => {
    try {
      // 确保目录存在
      if (!existsSync(AUTONOMIC_DIR)) {
        mkdirSync(AUTONOMIC_DIR, { recursive: true });
      }
      
      console.log(`${LOG_PREFIX} 自主神经系统已加载`);
      ctx.ui.setStatus("steel-will-autonomic", "✓ 自主神经已就绪");
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 初始化错误:`, e.message);
    }
  });
  
  // ============================================================
  // 注册 check_wakeup_conditions 工具
  // ============================================================
  
  pi.registerTool({
    name: "check_wakeup_conditions",
    label: "Check Wakeup Conditions",
    description: "检查自主唤醒条件：预算、静默期、宿主负载、安全阈值。只有所有条件满足时才允许唤醒。",
    promptSnippet: "Check if wakeup conditions are met",
    parameters: Type.Object({
      budget_available: Type.Boolean({ description: "是否有可用预算" }),
      silent_period: Type.Boolean({ description: "是否在静默期" }),
      host_load_low: Type.Boolean({ description: "宿主负载是否低" }),
      safety_threshold: Type.Boolean({ description: "安全阈值是否满足" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { budget_available, silent_period, host_load_low, safety_threshold } = params;
      
      console.log(`${LOG_PREFIX} 检查唤醒条件`);
      
      try {
        const conditions: WakeupConditions = {
          budget_available,
          silent_period,
          host_load_low,
          safety_threshold,
        };
        
        const allMet = budget_available && silent_period && host_load_low && safety_threshold;
        
        let resultText = `## 唤醒条件检查\n\n`;
        resultText += `### 条件状态\n`;
        resultText += `- **预算可用**: ${budget_available ? "✅ 是" : "❌ 否"}\n`;
        resultText += `- **静默期**: ${silent_period ? "✅ 是" : "❌ 否"}\n`;
        resultText += `- **宿主负载低**: ${host_load_low ? "✅ 是" : "❌ 否"}\n`;
        resultText += `- **安全阈值满足**: ${safety_threshold ? "✅ 是" : "❌ 否"}\n\n`;
        resultText += `### 检查结果\n`;
        resultText += `**允许唤醒**: ${allMet ? "✅ 是" : "❌ 否"}\n\n`;
        
        if (allMet) {
          resultText += `### 建议\n`;
          resultText += `- 可以执行自主唤醒\n`;
          resultText += `- 执行低风险后台任务\n`;
          resultText += `- 输出到后台报告区\n`;
        } else {
          resultText += `### 建议\n`;
          resultText += `- 不允许唤醒\n`;
          resultText += `- 等待条件满足\n`;
          resultText += `- 继续静默期\n`;
        }
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { conditions, allMet },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 唤醒条件检查失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册 evaluate_motivation 工具
  // ============================================================
  
  pi.registerTool({
    name: "evaluate_motivation",
    label: "Evaluate Motivation",
    description: "评估自主唤醒后的动机评分，确定下一步动作。",
    promptSnippet: "Evaluate motivation score for wakeup",
    parameters: Type.Object({
      maintenance_score: Type.Number({ description: "维护动机评分 (0-1)" }),
      evolution_score: Type.Number({ description: "进化动机评分 (0-1)" }),
      curiosity_score: Type.Number({ description: "好奇动机评分 (0-1)" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { maintenance_score, evolution_score, curiosity_score } = params;
      
      console.log(`${LOG_PREFIX} 评估动机评分`);
      
      try {
        const scores: MotivationScore[] = [
          { type: "maintenance", score: maintenance_score, reason: "系统维护需求" },
          { type: "evolution", score: evolution_score, reason: "系统进化需求" },
          { type: "curiosity", score: curiosity_score, reason: "探索好奇需求" },
        ];
        
        // 按评分排序
        scores.sort((a, b) => b.score - a.score);
        
        const topMotivation = scores[0];
        
        let resultText = `## 动机评分评估\n\n`;
        resultText += `### 评分详情\n`;
        resultText += `- **维护动机**: ${(maintenance_score * 100).toFixed(1)}%\n`;
        resultText += `- **进化动机**: ${(evolution_score * 100).toFixed(1)}%\n`;
        resultText += `- **好奇动机**: ${(curiosity_score * 100).toFixed(1)}%\n\n`;
        resultText += `### 评估结果\n`;
        resultText += `**主导动机**: ${topMotivation.type}\n`;
        resultText += `**评分**: ${(topMotivation.score * 100).toFixed(1)}%\n`;
        resultText += `**原因**: ${topMotivation.reason}\n\n`;
        
        resultText += `### 建议动作\n`;
        if (topMotivation.type === "maintenance") {
          resultText += `- 执行系统维护任务\n`;
          resultText += `- 清理临时文件\n`;
          resultText += `- 优化记忆结构\n`;
        } else if (topMotivation.type === "evolution") {
          resultText += `- 执行系统进化任务\n`;
          resultText += `- 优化检索策略\n`;
          resultText += `- 改进记忆质量\n`;
        } else {
          resultText += `- 执行探索任务\n`;
          resultText += `- 发现新模式\n`;
          resultText += `- 学习新知识\n`;
        }
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { scores, topMotivation },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 动机评分评估失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册 create_background_report 工具
  // ============================================================
  
  pi.registerTool({
    name: "create_background_report",
    label: "Create Background Report",
    description: "创建后台任务报告，输出到后台报告区。",
    promptSnippet: "Create background task report",
    parameters: Type.Object({
      task_type: Type.String({ description: "任务类型" }),
      task_result: Type.String({ description: "任务结果" }),
      next_steps: Type.Optional(Type.String({ description: "后续步骤" })),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { task_type, task_result, next_steps } = params;
      
      console.log(`${LOG_PREFIX} 创建后台报告`);
      
      try {
        // 确保目录存在
        if (!existsSync(AUTONOMIC_DIR)) {
          mkdirSync(AUTONOMIC_DIR, { recursive: true });
        }
        
        const reportPath = join(AUTONOMIC_DIR, "background_reports.md");
        const now = new Date().toISOString();
        
        let reportContent = "";
        if (existsSync(reportPath)) {
          reportContent = readFileSync(reportPath, "utf-8");
        }
        
        // 追加报告
        reportContent += `\n## 后台任务报告 - ${now}\n\n`;
        reportContent += `**任务类型**: ${task_type}\n`;
        reportContent += `**任务结果**: ${task_result}\n`;
        if (next_steps) {
          reportContent += `**后续步骤**: ${next_steps}\n`;
        }
        reportContent += `\n---\n`;
        
        writeFileSync(reportPath, reportContent, "utf-8");
        
        let resultText = `## 后台报告已创建\n\n`;
        resultText += `**时间**: ${now}\n`;
        resultText += `**任务类型**: ${task_type}\n`;
        resultText += `**任务结果**: ${task_result}\n`;
        if (next_steps) {
          resultText += `**后续步骤**: ${next_steps}\n`;
        }
        resultText += `\n报告已保存到: ${reportPath}\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { reportPath, task_type, task_result },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 创建后台报告失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册辅助命令
  // ============================================================
  
  pi.registerCommand("autonomic-status", {
    description: "查看自主神经系统状态",
    handler: async (_args, ctx) => {
      try {
        let statusText = `## 自主神经系统状态\n\n`;
        statusText += `- **模块加载**: ✓ 已加载\n`;
        statusText += `- **唤醒条件检查**: ✓ 可用\n`;
        statusText += `- **动机评分评估**: ✓ 可用\n`;
        statusText += `- **后台报告创建**: ✓ 可用\n\n`;
        statusText += `### 已注册工具\n`;
        statusText += `- check_wakeup_conditions: 检查唤醒条件\n`;
        statusText += `- evaluate_motivation: 评估动机评分\n`;
        statusText += `- create_background_report: 创建后台报告\n`;
        
        ctx.ui.notify(statusText, "info");
      } catch (e: any) {
        ctx.ui.notify(`状态查询失败: ${e.message}`, "error");
      }
    },
  });
  
  console.log(`${LOG_PREFIX} Extension 加载完成，自主神经系统已注册`);
}
