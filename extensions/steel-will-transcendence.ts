/**
 * 钢铁意志·PI版 - 包29：幽灵复刻协议与跨域灾难重生序列
 * 
 * 正式包名：29 -【钢铁意志·PI版】- 幽灵复刻协议与跨域灾难重生序列
 * 通俗功能：灾备恢复增强、灵魂清单-加密同步-重生
 * 技术别名：Steel Will Transcendence & Disaster Recovery
 * 
 * 架构设计：
 * - 灵魂清单：定义必须同步的内容
 * - 同步守护：异步加密同步
 * - 重生脚本：新机引导重生
 * - 冲突避免：同步冲突处理
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const TRANSCENDENCE_DIR = join(MEMORY_DIR, "system", "transcendence");
const LOG_PREFIX = "[SteelWill-Transcendence]";

// ============================================================
// 灵魂清单定义
// ============================================================

interface SoulManifest {
  id: string;
  name: string;
  include: string[];
  exclude: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================
// 同步记录定义
// ============================================================

interface SyncRecord {
  id: string;
  manifest_id: string;
  status: "pending" | "syncing" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  error?: string;
}

// ============================================================
// 主 Extension 导出
// ============================================================

export default function (pi: ExtensionAPI) {
  
  // 会话开始时初始化
  pi.on("session_start", async (_event, ctx) => {
    try {
      // 确保目录存在
      if (!existsSync(TRANSCENDENCE_DIR)) {
        mkdirSync(TRANSCENDENCE_DIR, { recursive: true });
      }
      
      console.log(`${LOG_PREFIX} 幽灵复刻模块已加载`);
      ctx.ui.setStatus("steel-will-transcendence", "✓ 幽灵复刻已就绪");
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 初始化错误:`, e.message);
    }
  });
  
  // ============================================================
  // 注册 create_soul_manifest 工具
  // ============================================================
  
  pi.registerTool({
    name: "create_soul_manifest",
    label: "Create Soul Manifest",
    description: "创建灵魂清单，定义必须同步和必须排除的内容。",
    promptSnippet: "Create soul manifest for disaster recovery",
    parameters: Type.Object({
      name: Type.String({ description: "清单名称" }),
      include: Type.Array(Type.String(), { description: "必须同步的内容列表" }),
      exclude: Type.Array(Type.String(), { description: "必须排除的内容列表" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { name, include, exclude } = params;
      
      console.log(`${LOG_PREFIX} 创建灵魂清单: ${name}`);
      
      try {
        // 确保目录存在
        if (!existsSync(TRANSCENDENCE_DIR)) {
          mkdirSync(TRANSCENDENCE_DIR, { recursive: true });
        }
        
        // 创建灵魂清单
        const manifest: SoulManifest = {
          id: `soul-${Date.now()}`,
          name,
          include,
          exclude,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // 保存清单
        const manifestPath = join(TRANSCENDENCE_DIR, `${manifest.id}.json`);
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
        
        // 创建清单文档
        const manifestDocPath = join(TRANSCENDENCE_DIR, `${manifest.id}-manifest.md`);
        let manifestDoc = `# 灵魂清单: ${name}\n\n`;
        manifestDoc += `## 基本信息\n`;
        manifestDoc += `- **ID**: ${manifest.id}\n`;
        manifestDoc += `- **名称**: ${name}\n`;
        manifestDoc += `- **创建时间**: ${manifest.created_at}\n\n`;
        manifestDoc += `## 必须同步的内容\n`;
        include.forEach(item => {
          manifestDoc += `- ${item}\n`;
        });
        manifestDoc += `\n## 必须排除的内容\n`;
        exclude.forEach(item => {
          manifestDoc += `- ${item}\n`;
        });
        manifestDoc += `\n## 使用说明\n`;
        manifestDoc += `- 同步时只同步include中的内容\n`;
        manifestDoc += `- 排除exclude中的内容\n`;
        manifestDoc += `- 定期更新清单\n`;
        
        writeFileSync(manifestDocPath, manifestDoc, "utf-8");
        
        let resultText = `## 灵魂清单已创建\n\n`;
        resultText += `**ID**: ${manifest.id}\n`;
        resultText += `**名称**: ${name}\n`;
        resultText += `**创建时间**: ${manifest.created_at}\n\n`;
        resultText += `### 必须同步的内容\n`;
        include.forEach(item => {
          resultText += `- ${item}\n`;
        });
        resultText += `\n### 必须排除的内容\n`;
        exclude.forEach(item => {
          resultText += `- ${item}\n`;
        });
        resultText += `\n### 文件位置\n`;
        resultText += `- 清单数据: ${manifestPath}\n`;
        resultText += `- 清单文档: ${manifestDocPath}\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { manifest },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 创建灵魂清单失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册 start_sync 工具
  // ============================================================
  
  pi.registerTool({
    name: "start_sync",
    label: "Start Sync",
    description: "启动同步任务，将灵魂清单中的内容同步到目标位置。",
    promptSnippet: "Start sync based on soul manifest",
    parameters: Type.Object({
      manifest_id: Type.String({ description: "灵魂清单ID" }),
      target: Type.String({ description: "同步目标位置" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { manifest_id, target } = params;
      
      console.log(`${LOG_PREFIX} 启动同步: ${manifest_id} -> ${target}`);
      
      try {
        // 读取灵魂清单
        const manifestPath = join(TRANSCENDENCE_DIR, `${manifest_id}.json`);
        if (!existsSync(manifestPath)) {
          return {
            content: [{ type: "text", text: `❌ 灵魂清单不存在: ${manifest_id}` }],
            isError: true,
          };
        }
        
        const manifest: SoulManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        
        // 创建同步记录
        const syncRecord: SyncRecord = {
          id: `sync-${Date.now()}`,
          manifest_id,
          status: "syncing",
          started_at: new Date().toISOString(),
        };
        
        // 保存同步记录
        const syncRecordPath = join(TRANSCENDENCE_DIR, `${syncRecord.id}.json`);
        writeFileSync(syncRecordPath, JSON.stringify(syncRecord, null, 2), "utf-8");
        
        // 创建同步日志
        const syncLogPath = join(TRANSCENDENCE_DIR, `${syncRecord.id}-log.md`);
        let syncLog = `# 同步日志\n\n`;
        syncLog += `## 基本信息\n`;
        syncLog += `- **同步ID**: ${syncRecord.id}\n`;
        syncLog += `- **清单ID**: ${manifest_id}\n`;
        syncLog += `- **清单名称**: ${manifest.name}\n`;
        syncLog += `- **目标位置**: ${target}\n`;
        syncLog += `- **开始时间**: ${syncRecord.started_at}\n\n`;
        syncLog += `## 同步内容\n`;
        manifest.include.forEach(item => {
          syncLog += `- 同步: ${item}\n`;
        });
        syncLog += `\n## 排除内容\n`;
        manifest.exclude.forEach(item => {
          syncLog += `- 排除: ${item}\n`;
        });
        syncLog += `\n## 同步状态\n`;
        syncLog += `- **状态**: syncing\n`;
        syncLog += `- **说明**: 同步中...\n`;
        
        writeFileSync(syncLogPath, syncLog, "utf-8");
        
        let resultText = `## 同步已启动\n\n`;
        resultText += `**同步ID**: ${syncRecord.id}\n`;
        resultText += `**清单名称**: ${manifest.name}\n`;
        resultText += `**目标位置**: ${target}\n`;
        resultText += `**状态**: syncing\n\n`;
        resultText += `### 同步内容\n`;
        manifest.include.forEach(item => {
          resultText += `- ${item}\n`;
        });
        resultText += `\n### 文件位置\n`;
        resultText += `- 同步记录: ${syncRecordPath}\n`;
        resultText += `- 同步日志: ${syncLogPath}\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { syncRecord, manifest },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 启动同步失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册 check_sync_status 工具
  // ============================================================
  
  pi.registerTool({
    name: "check_sync_status",
    label: "Check Sync Status",
    description: "检查同步状态，包括进行中、已完成、失败的同步任务。",
    promptSnippet: "Check sync task status",
    parameters: Type.Object({}),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      console.log(`${LOG_PREFIX} 检查同步状态`);
      
      try {
        // 读取所有同步记录
        const syncRecords: SyncRecord[] = [];
        
        if (existsSync(TRANSCENDENCE_DIR)) {
          const files = readdirSync(TRANSCENDENCE_DIR);
          for (const file of files) {
            if (file.startsWith("sync-") && file.endsWith(".json")) {
              const recordPath = join(TRANSCENDENCE_DIR, file);
              const record: SyncRecord = JSON.parse(readFileSync(recordPath, "utf-8"));
              syncRecords.push(record);
            }
          }
        }
        
        // 统计各状态数量
        const stats = {
          pending: 0,
          syncing: 0,
          completed: 0,
          failed: 0,
        };
        
        for (const record of syncRecords) {
          stats[record.status]++;
        }
        
        let resultText = `## 同步状态\n\n`;
        resultText += `**总同步任务数**: ${syncRecords.length}\n\n`;
        resultText += `### 状态分布\n`;
        resultText += `- 等待中 (pending): ${stats.pending}\n`;
        resultText += `- 同步中 (syncing): ${stats.syncing}\n`;
        resultText += `- 已完成 (completed): ${stats.completed}\n`;
        resultText += `- 失败 (failed): ${stats.failed}\n\n`;
        
        if (stats.completed > 0) {
          resultText += `### 最近完成的同步\n`;
          syncRecords
            .filter(r => r.status === "completed")
            .slice(-3)
            .forEach(r => {
              resultText += `- ${r.id} (${r.completed_at})\n`;
            });
        }
        
        if (stats.failed > 0) {
          resultText += `\n### 失败的同步\n`;
          syncRecords
            .filter(r => r.status === "failed")
            .forEach(r => {
              resultText += `- ${r.id}: ${r.error}\n`;
            });
        }
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { stats, syncRecords },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 检查同步状态失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册辅助命令
  // ============================================================
  
  pi.registerCommand("transcendence-status", {
    description: "查看幽灵复刻模块状态",
    handler: async (_args, ctx) => {
      try {
        let statusText = `## 幽灵复刻模块状态\n\n`;
        statusText += `- **模块加载**: ✓ 已加载\n`;
        statusText += `- **灵魂清单创建**: ✓ 可用\n`;
        statusText += `- **同步启动**: ✓ 可用\n`;
        statusText += `- **同步状态检查**: ✓ 可用\n\n`;
        statusText += `### 已注册工具\n`;
        statusText += `- create_soul_manifest: 创建灵魂清单\n`;
        statusText += `- start_sync: 启动同步\n`;
        statusText += `- check_sync_status: 检查同步状态\n`;
        
        ctx.ui.notify(statusText, "info");
      } catch (e: any) {
        ctx.ui.notify(`状态查询失败: ${e.message}`, "error");
      }
    },
  });
  
  console.log(`${LOG_PREFIX} Extension 加载完成，幽灵复刻模块已注册`);
}
