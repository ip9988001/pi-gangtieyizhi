/**
 * 钢铁意志·PI版 - 语义检索技能入口
 * 
 * 注册 recall_memory 工具，供 PI 在 Reasoning Loop 中调用
 */

import semanticRetrievalService from "../../services/steel-will-semantic-retrieval.ts";

export default function (pi: any) {
  // 注册 recall_memory 工具
  pi.registerTool("recall_memory", {
    description: "当你需要回忆历史设定、排查曾踩过的坑、或者查找过往项目的上下文时，使用此工具进行语义搜索。",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "描述你需要寻找的内容，支持自然语言，例如：'防御矩阵密钥'、'微服务重启教训'、'钢铁意志系统架构'"
        }
      },
      required: ["query"]
    },
    handler: async (params: { query: string }) => {
      const { query } = params;
      
      console.log(`[SteelWill-Recall] 正在回忆: "${query}"`);
      
      try {
        // 调用语义检索服务
        const results = await semanticRetrievalService.searchMemory(query, 3);
        
        if (results.length === 0) {
          return `未找到与"${query}"相关的历史记忆。`;
        }
        
        // 格式化为 Markdown 字符串
        let markdown = `找到 ${results.length} 条相关历史记忆：\n\n`;
        
        results.forEach((result, index) => {
          const score = (result.score * 100).toFixed(0);
          const memoryType = result.metadata.memoryType.toUpperCase();
          const filePath = result.metadata.filePath;
          
          // 提取文件名作为来源标识
          const fileName = filePath.split(/[/\\]/).pop() || filePath;
          
          markdown += `**[${index + 1}] 相似度: ${result.score.toFixed(2)} (${score}%) | 来源: ${memoryType}**\n`;
          markdown += `文件: ${fileName}\n`;
          markdown += `路径: ${filePath}\n`;
          markdown += `内容:\n${result.text.substring(0, 500)}${result.text.length > 500 ? '...' : ''}\n`;
          
          if (index < results.length - 1) {
            markdown += `\n---\n\n`;
          }
        });
        
        console.log(`[SteelWill-Recall] ✅ 找到 ${results.length} 条相关记忆`);
        
        return markdown;
        
      } catch (error: any) {
        console.error(`[SteelWill-Recall] ❌ 回忆失败:`, error.message);
        return `回忆失败: ${error.message}`;
      }
    }
  });
  
  // 注册手动命令
  pi.registerCommand("steel-will-recall", {
    description: "语义检索历史记忆",
    handler: async (ctx: any, query: string) => {
      if (!query) {
        ctx.ui.notify("请提供查询内容，例如：/steel-will-recall 防御矩阵密钥", "warning");
        return;
      }
      
      try {
        ctx.ui.notify(`正在回忆: "${query}"...`, "info");
        
        const results = await semanticRetrievalService.searchMemory(query, 3);
        
        if (results.length === 0) {
          ctx.ui.notify(`未找到与"${query}"相关的历史记忆。`, "warning");
          return;
        }
        
        // 格式化输出
        let output = `## 语义检索结果\n\n`;
        output += `**查询**: ${query}\n`;
        output += `**找到**: ${results.length} 条相关记忆\n\n`;
        
        results.forEach((result, index) => {
          const score = (result.score * 100).toFixed(0);
          const memoryType = result.metadata.memoryType.toUpperCase();
          const filePath = result.metadata.filePath;
          const fileName = filePath.split(/[/\\]/).pop() || filePath;
          
          output += `### [${index + 1}] 相似度: ${result.score.toFixed(2)} (${score}%)\n`;
          output += `**来源**: ${memoryType}\n`;
          output += `**文件**: ${fileName}\n`;
          output += `**路径**: ${filePath}\n\n`;
          output += `**内容**:\n\`\`\`\n${result.text.substring(0, 500)}${result.text.length > 500 ? '...' : ''}\n\`\`\`\n\n`;
        });
        
        ctx.ui.notify(output, "info");
        
      } catch (error: any) {
        ctx.ui.notify(`回忆失败: ${error.message}`, "error");
      }
    }
  });
  
  console.log("[SteelWill-SemanticRetrieval] ✅ recall_memory 工具已注册");
}
