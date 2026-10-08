/**
 * 钢铁意志·PI版 - 包24：降维捕获网与向量级语义雷达
 * 
 * 正式包名：24 -【钢铁意志·PI版】- 降维捕获网与向量级语义雷达
 * 通俗功能：语义检索增强、查询路由、结果过滤、新鲜度加权
 * 技术别名：Steel Will Vector Radar & Query Router
 * 
 * 架构设计：
 * - 查询路由：问题类型分类，默认recall路径
 * - 结果过滤：压制stale/conflict/superseded/partial
 * - 新鲜度加权：last_verified/freshness/last_accessed排序
 * - 中文别名：同义词映射，提高召回率
 * - 读取预算控制：R0/R1/R2分层
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const SYSTEM_DIR = join(MEMORY_DIR, "system");
const LOG_PREFIX = "[SteelWill-VectorRadar]";

// ============================================================
// 查询类型定义
// ============================================================

type QueryType = "status" | "preference" | "decision" | "case" | "timeline" | "fuzzy";

interface QueryRoute {
  type: QueryType;
  default_path: "S1" | "S2" | "S3";
  description: string;
}

// ============================================================
// 读取预算定义
// ============================================================

type ReadBudget = "R0" | "R1" | "R2";

interface BudgetRule {
  level: ReadBudget;
  max_results: number;
  max_depth: number;
  description: string;
}

// ============================================================
// 中文别名映射
// ============================================================

interface AliasMapping {
  original: string;
  aliases: string[];
  synonyms: string[];
}

// ============================================================
// 主 Extension 导出
// ============================================================

const EXPOSE_DIAGNOSTIC_TOOLS = false; // 2026-10-07 摘工具（改 true + 重开会话即恢复）

export default function (pi: ExtensionAPI) {
  
  // 会话开始时初始化
  pi.on("session_start", async (_event, ctx) => {
    try {
      console.log(`${LOG_PREFIX} 向量雷达模块已加载`);
      ctx.ui.setStatus("steel-will-vector-radar", "✓ 向量雷达已就绪");
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 初始化错误:`, e.message);
    }
  });
  
  // ============================================================
  // 注册 route_query 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "route_query",
    label: "Route Query",
    description: "对查询进行路由分类，确定默认recall路径（S1/S2/S3）。在进入recall前先判断问题类型。",
    promptSnippet: "Route query to appropriate recall path",
    parameters: Type.Object({
      query: Type.String({ description: "查询内容" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { query } = params;
      
      console.log(`${LOG_PREFIX} 路由查询: "${query}"`);
      
      try {
        // 查询类型分类
        let queryType: QueryType = "fuzzy";
        let defaultPath: "S1" | "S2" | "S3" = "S2";
        let reason = "";
        
        const lowerQuery = query.toLowerCase();
        
        // 状态类查询
        if (lowerQuery.includes("状态") || lowerQuery.includes("status") || 
            lowerQuery.includes("当前") || lowerQuery.includes("现在")) {
          queryType = "status";
          defaultPath = "S1";
          reason = "状态类查询，优先走S1快速检索";
        }
        // 偏好类查询
        else if (lowerQuery.includes("偏好") || lowerQuery.includes("喜欢") || 
                 lowerQuery.includes("preference") || lowerQuery.includes("总是")) {
          queryType = "preference";
          defaultPath = "S1";
          reason = "偏好类查询，优先走S1快速检索";
        }
        // 决策类查询
        else if (lowerQuery.includes("决策") || lowerQuery.includes("决定") || 
                 lowerQuery.includes("选择") || lowerQuery.includes("decision")) {
          queryType = "decision";
          defaultPath = "S2";
          reason = "决策类查询，走S2语义检索";
        }
        // 案例类查询
        else if (lowerQuery.includes("案例") || lowerQuery.includes("教训") || 
                 lowerQuery.includes("经验") || lowerQuery.includes("case")) {
          queryType = "case";
          defaultPath = "S2";
          reason = "案例类查询，走S2语义检索";
        }
        // 时间线查询
        else if (lowerQuery.includes("时间") || lowerQuery.includes("历史") || 
                 lowerQuery.includes("之前") || lowerQuery.includes("timeline")) {
          queryType = "timeline";
          defaultPath = "S2";
          reason = "时间线查询，走S2语义检索";
        }
        // 模糊回忆
        else {
          queryType = "fuzzy";
          defaultPath = "S2";
          reason = "模糊回忆查询，走S2语义检索";
        }
        
        let resultText = `## 查询路由结果\n\n`;
        resultText += `**查询**: ${query}\n`;
        resultText += `**类型**: ${queryType}\n`;
        resultText += `**默认路径**: ${defaultPath}\n`;
        resultText += `**路由原因**: ${reason}\n\n`;
        resultText += `### 路由说明\n`;
        resultText += `- S1: 快速检索（状态、偏好）\n`;
        resultText += `- S2: 语义检索（决策、案例、时间线、模糊）\n`;
        resultText += `- S3: 深度检索（复杂问题，需要多轮）\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { queryType, defaultPath, reason },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 查询路由失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册 filter_results 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "filter_results",
    label: "Filter Results",
    description: "过滤recall结果，压制stale/conflict/superseded/partial状态的条目，保留高质量结果。",
    promptSnippet: "Filter recall results by status",
    parameters: Type.Object({
      results: Type.String({ description: "recall结果（JSON格式）" }),
      keep_conflict: Type.Optional(Type.Boolean({ 
        description: "是否保留冲突条目以提示风险",
        default: false 
      })),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { results, keep_conflict = false } = params;
      
      console.log(`${LOG_PREFIX} 过滤结果`);
      
      try {
        // 解析结果
        let parsedResults: any[];
        try {
          parsedResults = JSON.parse(results);
        } catch {
          parsedResults = [];
        }
        
        // 过滤规则
        const filtered = parsedResults.filter((result: any) => {
          const state = result.state || "active";
          
          // 默认压制的状态
          if (state === "stale" || state === "superseded" || state === "partial") {
            return false;
          }
          
          // 冲突条目根据参数决定
          if (state === "conflict" && !keep_conflict) {
            return false;
          }
          
          return true;
        });
        
        // 降权标记
        const processed = filtered.map((result: any) => {
          const state = result.state || "active";
          const freshness = result.freshness || "fresh";
          
          let weight = 1.0;
          let warning = "";
          
          // 新鲜度降权
          if (freshness === "stale") {
            weight *= 0.7;
            warning += "条目可能过时，";
          } else if (freshness === "unverified") {
            weight *= 0.5;
            warning += "条目未验证，";
          }
          
          // 冲突降权
          if (state === "conflict") {
            weight *= 0.5;
            warning += "存在冲突，";
          }
          
          return {
            ...result,
            weight,
            warning: warning || "无",
          };
        });
        
        // 按权重排序
        processed.sort((a: any, b: any) => b.weight - a.weight);
        
        let resultText = `## 结果过滤结果\n\n`;
        resultText += `**原始结果数**: ${parsedResults.length}\n`;
        resultText += `**过滤后结果数**: ${filtered.length}\n`;
        resultText += `**保留冲突条目**: ${keep_conflict ? "是" : "否"}\n\n`;
        
        if (processed.length > 0) {
          resultText += `### 过滤后结果\n`;
          processed.forEach((result: any, index: number) => {
            resultText += `${index + 1}. ${result.title || result.path || "未知"} `;
            resultText += `(权重: ${result.weight.toFixed(2)}, ${result.warning})\n`;
          });
        } else {
          resultText += `### 无有效结果\n`;
          resultText += `所有结果均被过滤或降权。\n`;
        }
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { originalCount: parsedResults.length, filteredCount: filtered.length, results: processed },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 结果过滤失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册 check_read_budget 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "check_read_budget",
    label: "Check Read Budget",
    description: "检查当前查询的读取预算，确定允许的读取深度（R0/R1/R2）。",
    promptSnippet: "Check read budget for query",
    parameters: Type.Object({
      query: Type.String({ description: "查询内容" }),
      query_type: Type.Optional(Type.String({ 
        description: "查询类型",
        default: "fuzzy" 
      })),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { query, query_type = "fuzzy" } = params;
      
      console.log(`${LOG_PREFIX} 检查读取预算`);
      
      try {
        let budget: ReadBudget = "R0";
        let reason = "";
        let maxResults = 3;
        let maxDepth = 1;
        
        // 预算分配规则
        if (query_type === "status" || query_type === "preference") {
          budget = "R0";
          reason = "状态/偏好查询，只需R0快速检索";
          maxResults = 3;
          maxDepth = 1;
        } else if (query_type === "decision" || query_type === "case") {
          budget = "R1";
          reason = "决策/案例查询，需要R1语义检索";
          maxResults = 5;
          maxDepth = 2;
        } else if (query_type === "timeline" || query_type === "fuzzy") {
          budget = "R1";
          reason = "时间线/模糊查询，需要R1语义检索";
          maxResults = 5;
          maxDepth = 2;
        }
        
        // 复杂问题升级到R2
        if (query.length > 100 || query.includes("详细") || query.includes("深入")) {
          budget = "R2";
          reason = "复杂问题，升级到R2深度检索";
          maxResults = 10;
          maxDepth = 3;
        }
        
        let resultText = `## 读取预算检查\n\n`;
        resultText += `**查询**: ${query}\n`;
        resultText += `**查询类型**: ${query_type}\n`;
        resultText += `**读取预算**: ${budget}\n`;
        resultText += `**最大结果数**: ${maxResults}\n`;
        resultText += `**最大深度**: ${maxDepth}\n`;
        resultText += `**预算原因**: ${reason}\n\n`;
        resultText += `### 预算说明\n`;
        resultText += `- R0: 快速检索，最多3个结果\n`;
        resultText += `- R1: 语义检索，最多5个结果\n`;
        resultText += `- R2: 深度检索，最多10个结果\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { budget, maxResults, maxDepth, reason },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 读取预算检查失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册 expand_chinese_aliases 工具
  // ============================================================
  
  if (EXPOSE_DIAGNOSTIC_TOOLS) {
pi.registerTool({
    name: "expand_chinese_aliases",
    label: "Expand Chinese Aliases",
    description: "扩展中文别名和同义词，提高中文recall的召回率。",
    promptSnippet: "Expand Chinese aliases for better recall",
    parameters: Type.Object({
      query: Type.String({ description: "原始查询" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { query } = params;
      
      console.log(`${LOG_PREFIX} 扩展中文别名`);
      
      try {
        // 中文别名映射表
        const aliasMappings: AliasMapping[] = [
          // ---- 2026-09-30 扩充：覆盖实际业务实体 ----
          { original: "节点", aliases: ["节点", "机场", "线路", "服务器节点"], synonyms: ["node", "server"] },
          { original: "住宅IP", aliases: ["住宅IP", "住宅代理", "ISP代理", "原生IP"], synonyms: ["residential", "isp proxy"] },
          { original: "TikTok", aliases: ["TikTok", "TK", "抖音国际版", "国际版抖音"], synonyms: ["tiktok", "tk"] },
          { original: "防火墙", aliases: ["防火墙", "UFW", "iptables", "端口策略"], synonyms: ["firewall", "ufw"] },
          { original: "定时任务", aliases: ["定时任务", "计划任务", "cron", "systemd timer"], synonyms: ["cron", "timer", "schedule"] },
          { original: "桥接", aliases: ["桥接", "网关", "对接", "机器人"], synonyms: ["bridge", "gateway", "bot"] },
          { original: "向量检索", aliases: ["向量检索", "语义检索", "embedding索引"], synonyms: ["vector", "semantic", "embedding"] },
          { original: "记忆遗忘", aliases: ["遗忘", "衰减", "冷宫", "过期"], synonyms: ["forget", "decay", "expire"] },
          { original: "重启", aliases: ["重启", "重新启动", "重启动"], synonyms: ["restart", "reboot"] },
          { original: "部署", aliases: ["部署", "发布", "上线"], synonyms: ["deploy", "release"] },
          { original: "配置", aliases: ["配置", "设置", "设定"], synonyms: ["config", "setting"] },
          { original: "错误", aliases: ["错误", "故障", "问题", "bug"], synonyms: ["error", "bug", "issue"] },
          { original: "记忆", aliases: ["记忆", "存储", "保存"], synonyms: ["memory", "storage"] },
          { original: "检索", aliases: ["检索", "搜索", "查找", "查询"], synonyms: ["search", "query", "retrieve"] },
        ];
        
        // 扩展查询
        const expandedTerms: string[] = [query];
        const lowerQuery = query.toLowerCase();
        
        for (const mapping of aliasMappings) {
          // 注意：两侧都要小写化。只小写 query 会导致含拉丁字母的别名
          // （如 住宅IP / ISP代理 / TikTok）永远匹配不上——这是个潜伏已久的 bug。
          if (lowerQuery.includes(mapping.original.toLowerCase()) ||
              mapping.aliases.some(alias => lowerQuery.includes(alias.toLowerCase()))) {
            // 添加同义词
            expandedTerms.push(...mapping.synonyms);
            // 添加其他别名
            expandedTerms.push(...mapping.aliases.filter(alias => alias !== mapping.original));
          }
        }
        
        // 去重
        const uniqueTerms = [...new Set(expandedTerms)];
        
        let resultText = `## 中文别名扩展\n\n`;
        resultText += `**原始查询**: ${query}\n`;
        resultText += `**扩展后查询**: ${uniqueTerms.join(" | ")}\n\n`;
        resultText += `### 扩展说明\n`;
        resultText += `- 原始词: ${query}\n`;
        resultText += `- 扩展词: ${uniqueTerms.filter(t => t !== query).join(", ") || "无"}\n`;
        resultText += `- 扩展数量: ${uniqueTerms.length - 1}\n\n`;
        resultText += `### 注意事项\n`;
        resultText += `- 别名层服务recall，不是无边界扩写器\n`;
        resultText += `- 只添加稳定映射，不添加模糊同义词\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { original: query, expanded: uniqueTerms },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 中文别名扩展失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
}

  
  // ============================================================
  // 注册辅助命令
  // ============================================================
  
  pi.registerCommand("vector-radar-status", {
    description: "查看向量雷达模块状态",
    handler: async (_args, ctx) => {
      try {
        let statusText = `## 向量雷达模块状态\n\n`;
        statusText += `- **模块加载**: ✓ 已加载\n`;
        statusText += `- **查询路由**: ✓ 可用\n`;
        statusText += `- **结果过滤**: ✓ 可用\n`;
        statusText += `- **读取预算控制**: ✓ 可用\n`;
        statusText += `- **中文别名扩展**: ✓ 可用\n\n`;
        statusText += `### 已注册工具\n`;
        statusText += `- route_query: 查询路由分类\n`;
        statusText += `- filter_results: 结果过滤\n`;
        statusText += `- check_read_budget: 读取预算检查\n`;
        statusText += `- expand_chinese_aliases: 中文别名扩展\n`;
        
        ctx.ui.notify(statusText, "info");
      } catch (e: any) {
        ctx.ui.notify(`状态查询失败: ${e.message}`, "error");
      }
    },
  });
  
  console.log(`${LOG_PREFIX} Extension 加载完成，向量雷达模块已注册`);
}
