/**
 * 钢铁意志·PI版 - 包25：自动化克隆印记与任务模式图灵闭环
 * 
 * 正式包名：25 -【钢铁意志·PI版】- 自动化克隆印记与任务模式图灵闭环
 * 通俗功能：记忆-检索闭环、使用信号回流、热度回流
 * 技术别名：Steel Will Clone Imprint & Task Pattern Turing Loop
 * 
 * 架构设计：
 * - 记忆-检索字段契约
 * - 命中回写规则
 * - 热度回流规则
 * - recall信号账本
 * - INDEX反馈规则
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";
import { join } from "path";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const SYSTEM_DIR = join(MEMORY_DIR, "system");
const LEDGER_PATH = join(MEMORY_DIR, "agent", "system", "RECALL_SIGNAL_LEDGER.jsonl");
const LOG_PREFIX = "[SteelWill-CloneImprint]";

// ============================================================
// recall信号账本条目
// ============================================================

interface RecallSignalEntry {
  at: string;           // 时间戳
  target: string;       // 目标条目路径
  recall_source: string; // recall来源
  hit_context: string;  // 命中上下文
  retrieval_layer: string; // 检索层级
}

// ============================================================
// 主 Extension 导出
// ============================================================

const EXPOSE_DIAGNOSTIC_TOOLS = false; // 2026-10-07 摘工具（改 true + 重开会话即恢复）

export default function (pi: ExtensionAPI) {
  
  // 会话开始时初始化
  pi.on("session_start", async (_event, ctx) => {
    try {
      console.log(`${LOG_PREFIX} 克隆印记模块已加载`);
      ctx.ui.setStatus("steel-will-clone-imprint", "✓ 克隆印记已就绪");
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 初始化错误:`, e.message);
    }
  });
  
  // ============================================================
  // 注册 record_recall_signal 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "record_recall_signal",
    label: "Record Recall Signal",
    description: "记录recall命中信号到事件账本，用于回流训练记忆层。",
    promptSnippet: "Record recall hit signal to ledger",
    parameters: Type.Object({
      target: Type.String({ description: "目标条目路径" }),
      recall_source: Type.String({ description: "recall来源（S1/S2/S3）" }),
      hit_context: Type.String({ description: "命中上下文" }),
      retrieval_layer: Type.String({ description: "检索层级" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { target, recall_source, hit_context, retrieval_layer } = params;
      
      console.log(`${LOG_PREFIX} 记录recall信号: ${target}`);
      
      try {
        // 创建账本条目
        const entry: RecallSignalEntry = {
          at: new Date().toISOString(),
          target,
          recall_source,
          hit_context,
          retrieval_layer,
        };
        
        // 确保目录存在
        const ledgerDir = join(MEMORY_DIR, "agent", "system");
        if (!existsSync(ledgerDir)) {
          const { mkdirSync } = require("fs");
          mkdirSync(ledgerDir, { recursive: true });
        }
        
        // 追加到账本
        appendFileSync(LEDGER_PATH, JSON.stringify(entry) + "\n", "utf-8");
        
        let resultText = `## Recall信号已记录\n\n`;
        resultText += `**时间**: ${entry.at}\n`;
        resultText += `**目标**: ${target}\n`;
        resultText += `**来源**: ${recall_source}\n`;
        resultText += `**层级**: ${retrieval_layer}\n`;
        resultText += `**上下文**: ${hit_context}\n\n`;
        resultText += `信号已追加到账本: ${LEDGER_PATH}\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { entry },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 记录recall信号失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册 update_access_stats 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "update_access_stats",
    label: "Update Access Stats",
    description: "更新条目的访问统计（last_accessed、access_count），用于热度回流。",
    promptSnippet: "Update entry access statistics",
    parameters: Type.Object({
      entry_path: Type.String({ description: "条目文件路径" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { entry_path } = params;
      
      console.log(`${LOG_PREFIX} 更新访问统计: ${entry_path}`);
      
      try {
        if (!existsSync(entry_path)) {
          return {
            content: [{ type: "text", text: `❌ 条目不存在: ${entry_path}` }],
            isError: true,
          };
        }
        
        // 读取条目
        let content = readFileSync(entry_path, "utf-8");
        
        // 更新last_accessed
        const now = new Date().toISOString();
        if (content.includes("last_accessed:")) {
          content = content.replace(/last_accessed:.*$/m, `last_accessed: "${now}"`);
        } else {
          // 在元数据部分添加
          content = content.replace(/(last_verified:.*$)/m, `$1\nlast_accessed: "${now}"`);
        }
        
        // 更新access_count
        const countMatch = content.match(/access_count:\s*(\d+)/);
        if (countMatch) {
          const newCount = parseInt(countMatch[1]) + 1;
          content = content.replace(/access_count:\s*\d+/, `access_count: ${newCount}`);
        } else {
          content = content.replace(/(last_accessed:.*$)/m, `$1\naccess_count: 1`);
        }
        
        // 写回文件
        writeFileSync(entry_path, content, "utf-8");
        
        let resultText = `## 访问统计已更新\n\n`;
        resultText += `**条目**: ${entry_path}\n`;
        resultText += `**更新时间**: ${now}\n`;
        resultText += `**操作**: last_accessed已更新，access_count已递增\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { entry_path, updated_at: now },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 更新访问统计失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册 check_recall_contract 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "check_recall_contract",
    label: "Check Recall Contract",
    description: "检查条目是否符合记忆-检索字段契约，确认是否包含recall所需的最小字段。",
    promptSnippet: "Check if entry meets recall contract",
    parameters: Type.Object({
      entry_path: Type.String({ description: "条目文件路径" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { entry_path } = params;
      
      console.log(`${LOG_PREFIX} 检查recall契约: ${entry_path}`);
      
      try {
        if (!existsSync(entry_path)) {
          return {
            content: [{ type: "text", text: `❌ 条目不存在: ${entry_path}` }],
            isError: true,
          };
        }
        
        // 读取条目
        const content = readFileSync(entry_path, "utf-8");
        
        // 检查必要字段
        const requiredFields = [
          { name: "keywords", pattern: /keywords:\s*\[/ },
          { name: "aliases", pattern: /aliases:\s*\[/ },
          { name: "summary", pattern: /summary:\s*"/ },
          { name: "state", pattern: /state:\s*"/ },
          { name: "read_hint", pattern: /read_hint:\s*"/ },
          { name: "anchor_refs", pattern: /anchor_refs:\s*\[/ },
        ];
        
        const missingFields: string[] = [];
        const presentFields: string[] = [];
        
        for (const field of requiredFields) {
          if (field.pattern.test(content)) {
            presentFields.push(field.name);
          } else {
            missingFields.push(field.name);
          }
        }
        
        const isCompliant = missingFields.length === 0;
        
        let resultText = `## Recall契约检查\n\n`;
        resultText += `**条目**: ${entry_path}\n`;
        resultText += `**合规**: ${isCompliant ? "✅ 是" : "❌ 否"}\n\n`;
        
        resultText += `### 已包含字段\n`;
        presentFields.forEach(field => {
          resultText += `- ✅ ${field}\n`;
        });
        
        if (missingFields.length > 0) {
          resultText += `\n### 缺失字段\n`;
          missingFields.forEach(field => {
            resultText += `- ❌ ${field}\n`;
          });
          resultText += `\n**建议**: 补齐缺失字段以符合recall契约\n`;
        }
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { isCompliant, presentFields, missingFields },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 检查recall契约失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册辅助命令
  // ============================================================
  
  pi.registerCommand("clone-imprint-status", {
    description: "查看克隆印记模块状态",
    handler: async (_args, ctx) => {
      try {
        let statusText = `## 克隆印记模块状态\n\n`;
        statusText += `- **模块加载**: ✓ 已加载\n`;
        statusText += `- **recall信号记录**: ✓ 可用\n`;
        statusText += `- **访问统计更新**: ✓ 可用\n`;
        statusText += `- **recall契约检查**: ✓ 可用\n\n`;
        statusText += `### 已注册工具\n`;
        statusText += `- record_recall_signal: 记录recall信号\n`;
        statusText += `- update_access_stats: 更新访问统计\n`;
        statusText += `- check_recall_contract: 检查recall契约\n`;
        
        ctx.ui.notify(statusText, "info");
      } catch (e: any) {
        ctx.ui.notify(`状态查询失败: ${e.message}`, "error");
      }
    },
  });
  
  console.log(`${LOG_PREFIX} Extension 加载完成，克隆印记模块已注册`);
}
