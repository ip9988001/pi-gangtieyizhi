/**
 * 钢铁意志·PI版 - 包23：幻觉剔除手术与四重冗余逻辑校验器
 * 
 * 正式包名：23 -【钢铁意志·PI版】- 幻觉剔除手术与四重冗余逻辑校验器
 * 通俗功能：可信记忆增强、四重校验、幻觉剔除与可信层兜底
 * 技术别名：Steel Will Hallucination Eliminator & Quadruple Redundancy Validator
 * 
 * 架构设计：
 * - 可信元数据校验
 * - 强弱偏好分层
 * - 写入闸门控制
 * - 冲突升级链
 * - 超短续接快照
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const SYSTEM_DIR = join(MEMORY_DIR, "system");
const LOG_PREFIX = "[SteelWill-HallucinationEliminator]";

// ============================================================
// 可信元数据字段定义
// ============================================================

interface TrustedMetadata {
  anchor_refs: string[];      // 锚点引用
  confidence: number;         // 置信度 (0-1)
  last_verified: string;      // 最后验证时间
  freshness: "fresh" | "stale" | "unverified"; // 新鲜度
  state: "active" | "deprecated" | "conflict" | "pending"; // 状态
  owner: "user" | "agent" | "system"; // 所有者
  summary: string;            // 摘要
  keywords: string[];         // 关键词
  aliases: string[];          // 别名
  read_hint: string;          // 读取提示
}

// ============================================================
// 偏好强度定义
// ============================================================

type PreferenceStrength = "strong" | "weak" | "log";

interface PreferenceEntry {
  content: string;
  strength: PreferenceStrength;
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
  cross_session: boolean;
}

// ============================================================
// 写入闸门检查
// ============================================================

interface WriteGateCheck {
  has_anchor: boolean;
  frequency: number;
  impact: "high" | "medium" | "low";
  stability: "stable" | "volatile" | "unknown";
  allowed_layer: "L1" | "L2" | "L3" | "rejected";
  reason: string;
}

// ============================================================
// 主 Extension 导出
// ============================================================

const EXPOSE_DIAGNOSTIC_TOOLS = false; // 2026-10-07 摘工具（改 true + 重开会话即恢复）

export default function (pi: ExtensionAPI) {
  
  // 会话开始时初始化
  pi.on("session_start", async (_event, ctx) => {
    try {
      console.log(`${LOG_PREFIX} 幻觉剔除模块已加载`);
      ctx.ui.setStatus("steel-will-hallucination", "✓ 幻觉剔除已就绪");
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 初始化错误:`, e.message);
    }
  });
  
  // ============================================================
  // 注册 validate_memory 工具
  // ============================================================
  
  pi.registerTool({
    name: "validate_memory",
    label: "Validate Memory",
    description: "校验记忆条目的可信元数据，检查是否符合写入闸门要求。用于在写入L2/L3前进行四重校验。",
    promptSnippet: "Validate memory entry trusted metadata",
    parameters: Type.Object({
      content: Type.String({ description: "要校验的记忆内容" }),
      target_layer: Type.Optional(Type.String({ 
        description: "目标层级：L1、L2或L3",
        default: "L1" 
      })),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { content, target_layer = "L1" } = params;
      
      console.log(`${LOG_PREFIX} 校验记忆条目，目标层级: ${target_layer}`);
      
      try {
        // 四重校验
        const checks = {
          check1_anchor: false,      // 锚点校验
          check2_confidence: false,  // 置信度校验
          check3_freshness: false,   // 新鲜度校验
          check4_state: false,       // 状态校验
        };
        
        let resultText = `## 四重校验结果\n\n`;
        resultText += `**目标层级**: ${target_layer}\n`;
        resultText += `**内容长度**: ${content.length} 字符\n\n`;
        
        // 校验1：锚点检查
        const hasAnchor = content.includes("锚点") || content.includes("来源") || content.includes("证据");
        checks.check1_anchor = hasAnchor;
        resultText += `### 校验1：锚点检查\n`;
        resultText += hasAnchor ? "✅ 内容包含锚点引用\n\n" : "⚠️ 内容缺少锚点引用，建议补充来源\n\n";
        
        // 校验2：置信度检查
        const hasConfidence = content.length > 50; // 简单启发式
        checks.check2_confidence = hasConfidence;
        resultText += `### 校验2：置信度检查\n`;
        resultText += hasConfidence ? "✅ 内容长度足够，置信度可接受\n\n" : "⚠️ 内容过短，置信度可能不足\n\n";
        
        // 校验3：新鲜度检查
        const isFresh = !content.includes("过时") && !content.includes("旧版") && !content.includes("已废弃");
        checks.check3_freshness = isFresh;
        resultText += `### 校验3：新鲜度检查\n`;
        resultText += isFresh ? "✅ 内容新鲜度良好\n\n" : "⚠️ 内容可能已过时，建议验证\n\n";
        
        // 校验4：状态检查
        const isValidState = !content.includes("冲突") && !content.includes("矛盾");
        checks.check4_state = isValidState;
        resultText += `### 校验4：状态检查\n`;
        resultText += isValidState ? "✅ 内容状态正常\n\n" : "⚠️ 内容存在冲突，建议升级处理\n\n";
        
        // 写入闸门判定
        const passCount = Object.values(checks).filter(Boolean).length;
        let allowedLayer = "rejected";
        let gateReason = "";
        
        if (passCount === 4) {
          allowedLayer = target_layer;
          gateReason = "四重校验全部通过";
        } else if (passCount >= 3) {
          allowedLayer = target_layer === "L3" ? "L2" : target_layer;
          gateReason = "四重校验通过3项，降级写入";
        } else if (passCount >= 2) {
          allowedLayer = "L1";
          gateReason = "四重校验仅通过2项，仅允许L1";
        } else {
          allowedLayer = "rejected";
          gateReason = "四重校验不足2项，拒绝写入";
        }
        
        resultText += `## 写入闸门判定\n\n`;
        resultText += `**通过校验**: ${passCount}/4\n`;
        resultText += `**允许层级**: ${allowedLayer}\n`;
        resultText += `**判定原因**: ${gateReason}\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { checks, allowedLayer, passCount },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 校验失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册 check_preference_strength 工具
  // ============================================================
  
  pi.registerTool({
    name: "check_preference_strength",
    label: "Check Preference Strength",
    description: "检查偏好条目的强度等级（强偏好/弱偏好/日志），基于出现频次、跨会话稳定性等维度判断。",
    promptSnippet: "Check preference entry strength level",
    parameters: Type.Object({
      preference: Type.String({ description: "偏好内容" }),
      occurrence_count: Type.Optional(Type.Number({ 
        description: "出现次数",
        default: 1 
      })),
      cross_session: Type.Optional(Type.Boolean({ 
        description: "是否跨会话稳定",
        default: false 
      })),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { preference, occurrence_count = 1, cross_session = false } = params;
      
      try {
        let strength: PreferenceStrength = "log";
        let reason = "";
        
        // 判断偏好强度
        if (occurrence_count >= 3 && cross_session) {
          strength = "strong";
          reason = "出现3次以上且跨会话稳定，判定为强偏好";
        } else if (occurrence_count >= 2 || cross_session) {
          strength = "weak";
          reason = "出现2次或跨会话，判定为弱偏好";
        } else {
          strength = "log";
          reason = "仅出现1次且未跨会话，判定为日志";
        }
        
        let resultText = `## 偏好强度判定\n\n`;
        resultText += `**偏好内容**: ${preference}\n`;
        resultText += `**出现次数**: ${occurrence_count}\n`;
        resultText += `**跨会话**: ${cross_session ? "是" : "否"}\n\n`;
        resultText += `### 判定结果\n`;
        resultText += `**强度等级**: ${strength}\n`;
        resultText += `**判定原因**: ${reason}\n\n`;
        
        if (strength === "strong") {
          resultText += `### 建议\n`;
          resultText += `- 可写入L3长期记忆\n`;
          resultText += `- 添加可信元数据\n`;
          resultText += `- 定期验证有效性\n`;
        } else if (strength === "weak") {
          resultText += `### 建议\n`;
          resultText += `- 写入L2候选\n`;
          resultText += `- 继续观察是否升级为强偏好\n`;
          resultText += `- 不要一次聊天就固化\n`;
        } else {
          resultText += `### 建议\n`;
          resultText += `- 仅记录到日志\n`;
          resultText += `- 不进入L2/L3\n`;
          resultText += `- 等待更多证据\n`;
        }
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { strength, occurrence_count, cross_session },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 偏好强度判定失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册 create_ultra_snapshot 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "create_ultra_snapshot",
    label: "Create Ultra Snapshot",
    description: "创建超短续接快照，用于新窗口秒恢复。只保留最必要字段：当前目标、阶段、阻塞、下一步。",
    promptSnippet: "Create ultra-short continuity snapshot",
    parameters: Type.Object({
      current_goal: Type.String({ description: "当前目标" }),
      current_stage: Type.String({ description: "当前阶段" }),
      current_blocker: Type.Optional(Type.String({ description: "当前阻塞" })),
      next_action: Type.String({ description: "下一步动作" }),
      must_read: Type.Optional(Type.String({ description: "必读文件" })),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { current_goal, current_stage, current_blocker, next_action, must_read } = params;
      
      try {
        const snapshot = {
          timestamp: new Date().toISOString(),
          current_goal,
          current_stage,
          current_blocker: current_blocker || "无",
          next_action,
          must_read: must_read || "无",
        };
        
        // 写入超短续接快照文件
        const snapshotPath = join(SYSTEM_DIR, "ULTRA_CONTINUITY_SNAPSHOT.md");
        let snapshotContent = `# 超短续接快照\n\n`;
        snapshotContent += `## 元数据\n`;
        snapshotContent += `\`\`\`yaml\n`;
        snapshotContent += `timestamp: "${snapshot.timestamp}"\n`;
        snapshotContent += `purpose: "新窗口秒恢复"\n`;
        snapshotContent += `\`\`\`\n\n`;
        snapshotContent += `## 当前状态\n`;
        snapshotContent += `- **当前目标**: ${snapshot.current_goal}\n`;
        snapshotContent += `- **当前阶段**: ${snapshot.current_stage}\n`;
        snapshotContent += `- **当前阻塞**: ${snapshot.current_blocker}\n`;
        snapshotContent += `- **下一步动作**: ${snapshot.next_action}\n`;
        snapshotContent += `- **必读文件**: ${snapshot.must_read}\n`;
        
        writeFileSync(snapshotPath, snapshotContent, "utf-8");
        
        return {
          content: [{ type: "text", text: `✅ 超短续接快照已创建\n\n${snapshotContent}` }],
          details: { snapshotPath, snapshot },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 创建快照失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册辅助命令
  // ============================================================
  
  pi.registerCommand("hallucination-status", {
    description: "查看幻觉剔除模块状态",
    handler: async (_args, ctx) => {
      try {
        let statusText = `## 幻觉剔除模块状态\n\n`;
        statusText += `- **模块加载**: ✓ 已加载\n`;
        statusText += `- **四重校验**: ✓ 可用\n`;
        statusText += `- **偏好强度判定**: ✓ 可用\n`;
        statusText += `- **超短续接快照**: ✓ 可用\n\n`;
        statusText += `### 已注册工具\n`;
        statusText += `- validate_memory: 校验记忆条目\n`;
        statusText += `- check_preference_strength: 检查偏好强度\n`;
        statusText += `- create_ultra_snapshot: 创建超短续接快照\n`;
        
        ctx.ui.notify(statusText, "info");
      } catch (e: any) {
        ctx.ui.notify(`状态查询失败: ${e.message}`, "error");
      }
    },
  });
  
  console.log(`${LOG_PREFIX} Extension 加载完成，幻觉剔除模块已注册`);
}
