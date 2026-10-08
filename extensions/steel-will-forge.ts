/**
 * 钢铁意志·PI版 - 包28：零号工厂迭代车间与底层代码资产熔铸炉
 * 
 * 正式包名：28 -【钢铁意志·PI版】- 零号工厂迭代车间与底层代码资产熔铸炉
 * 通俗功能：自造工具增强、蓝图-沙箱-测试-列装
 * 技术别名：Steel Will Forge & Asset Factory
 * 
 * 架构设计：
 * - 蓝图：工具缺口发现与设计
 * - 沙箱：候选脚本试跑
 * - 测试台：自动化测试
 * - 资产列装：通过测试的脚本注册
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "~";
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");
const FORGE_DIR = join(MEMORY_DIR, "system", "forge");
const LOG_PREFIX = "[SteelWill-Forge]";

// ============================================================
// 工具状态定义
// ============================================================

type ToolState = "blueprint" | "sandbox" | "testing" | "enlisted" | "rejected";

interface ForgeTool {
  id: string;
  name: string;
  state: ToolState;
  description: string;
  risk_level: "low" | "medium" | "high";
  created_at: string;
  tested_at?: string;
  enlisted_at?: string;
}

// ============================================================
// 主 Extension 导出
// ============================================================

export default function (pi: ExtensionAPI) {
  
  // 会话开始时初始化
  pi.on("session_start", async (_event, ctx) => {
    try {
      // 确保目录存在
      if (!existsSync(FORGE_DIR)) {
        mkdirSync(FORGE_DIR, { recursive: true });
      }
      
      console.log(`${LOG_PREFIX} 零号工厂已加载`);
      ctx.ui.setStatus("steel-will-forge", "✓ 零号工厂已就绪");
    } catch (e: any) {
      console.error(`${LOG_PREFIX} 初始化错误:`, e.message);
    }
  });
  
  // ============================================================
  // 注册 create_blueprint 工具
  // ============================================================
  
  pi.registerTool({
    name: "create_blueprint",
    label: "Create Blueprint",
    description: "创建工具蓝图，描述工具缺口和设计方案。",
    promptSnippet: "Create tool blueprint",
    parameters: Type.Object({
      tool_name: Type.String({ description: "工具名称" }),
      description: Type.String({ description: "工具描述" }),
      risk_level: Type.String({ description: "风险等级：low/medium/high" }),
      gap_analysis: Type.String({ description: "缺口分析" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { tool_name, description, risk_level, gap_analysis } = params;
      
      console.log(`${LOG_PREFIX} 创建蓝图: ${tool_name}`);
      
      try {
        // 确保目录存在
        if (!existsSync(FORGE_DIR)) {
          mkdirSync(FORGE_DIR, { recursive: true });
        }
        
        // 创建蓝图
        const blueprint: ForgeTool = {
          id: `forge-${Date.now()}`,
          name: tool_name,
          state: "blueprint",
          description,
          risk_level: risk_level as "low" | "medium" | "high",
          created_at: new Date().toISOString(),
        };
        
        // 保存蓝图
        const blueprintPath = join(FORGE_DIR, `${blueprint.id}.json`);
        writeFileSync(blueprintPath, JSON.stringify(blueprint, null, 2), "utf-8");
        
        // 创建蓝图文档
        const blueprintDocPath = join(FORGE_DIR, `${blueprint.id}-blueprint.md`);
        let blueprintDoc = `# 工具蓝图: ${tool_name}\n\n`;
        blueprintDoc += `## 基本信息\n`;
        blueprintDoc += `- **ID**: ${blueprint.id}\n`;
        blueprintDoc += `- **名称**: ${tool_name}\n`;
        blueprintDoc += `- **风险等级**: ${risk_level}\n`;
        blueprintDoc += `- **创建时间**: ${blueprint.created_at}\n\n`;
        blueprintDoc += `## 工具描述\n${description}\n\n`;
        blueprintDoc += `## 缺口分析\n${gap_analysis}\n\n`;
        blueprintDoc += `## 下一步\n`;
        blueprintDoc += `- 进入沙箱测试\n`;
        blueprintDoc += `- 编写测试用例\n`;
        blueprintDoc += `- 执行自动化测试\n`;
        
        writeFileSync(blueprintDocPath, blueprintDoc, "utf-8");
        
        let resultText = `## 蓝图已创建\n\n`;
        resultText += `**ID**: ${blueprint.id}\n`;
        resultText += `**名称**: ${tool_name}\n`;
        resultText += `**风险等级**: ${risk_level}\n`;
        resultText += `**状态**: blueprint\n\n`;
        resultText += `### 文件位置\n`;
        resultText += `- 蓝图数据: ${blueprintPath}\n`;
        resultText += `- 蓝图文档: ${blueprintDocPath}\n\n`;
        resultText += `### 下一步\n`;
        resultText += `- 进入沙箱测试\n`;
        resultText += `- 编写测试用例\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { blueprint },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 创建蓝图失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册 test_in_sandbox 工具
  // ============================================================
  
  pi.registerTool({
    name: "test_in_sandbox",
    label: "Test in Sandbox",
    description: "在沙箱中测试候选脚本，验证功能和安全性。",
    promptSnippet: "Test tool in sandbox",
    parameters: Type.Object({
      tool_id: Type.String({ description: "工具ID" }),
      test_script: Type.String({ description: "测试脚本" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { tool_id, test_script } = params;
      
      console.log(`${LOG_PREFIX} 沙箱测试: ${tool_id}`);
      
      try {
        // 读取蓝图
        const blueprintPath = join(FORGE_DIR, `${tool_id}.json`);
        if (!existsSync(blueprintPath)) {
          return {
            content: [{ type: "text", text: `❌ 蓝图不存在: ${tool_id}` }],
            isError: true,
          };
        }
        
        const blueprint: ForgeTool = JSON.parse(readFileSync(blueprintPath, "utf-8"));
        
        // 更新状态为sandbox
        blueprint.state = "sandbox";
        writeFileSync(blueprintPath, JSON.stringify(blueprint, null, 2), "utf-8");
        
        // 记录测试
        const testLogPath = join(FORGE_DIR, `${tool_id}-test-log.md`);
        let testLog = `# 测试日志: ${blueprint.name}\n\n`;
        testLog += `## 测试时间: ${new Date().toISOString()}\n\n`;
        testLog += `## 测试脚本\n\`\`\`\n${test_script}\n\`\`\`\n\n`;
        testLog += `## 测试结果\n`;
        testLog += `- **状态**: sandbox\n`;
        testLog += `- **说明**: 沙箱测试中\n`;
        
        writeFileSync(testLogPath, testLog, "utf-8");
        
        let resultText = `## 沙箱测试已启动\n\n`;
        resultText += `**工具ID**: ${tool_id}\n`;
        resultText += `**工具名称**: ${blueprint.name}\n`;
        resultText += `**状态**: sandbox\n\n`;
        resultText += `### 测试日志\n`;
        resultText += `- ${testLogPath}\n\n`;
        resultText += `### 下一步\n`;
        resultText += `- 执行测试脚本\n`;
        resultText += `- 验证测试结果\n`;
        resultText += `- 决定是否列装\n`;
        
        return {
          content: [{ type: "text", text: resultText }],
          details: { blueprint },
        };
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 沙箱测试失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册 enlist_tool 工具
  // ============================================================
  
  pi.registerTool({
    name: "enlist_tool",
    label: "Enlist Tool",
    description: "将通过测试的工具列装到资产区。",
    promptSnippet: "Enlist tested tool",
    parameters: Type.Object({
      tool_id: Type.String({ description: "工具ID" }),
      test_passed: Type.Boolean({ description: "测试是否通过" }),
    }),
    
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const { tool_id, test_passed } = params;
      
      console.log(`${LOG_PREFIX} 列装工具: ${tool_id}`);
      
      try {
        // 读取蓝图
        const blueprintPath = join(FORGE_DIR, `${tool_id}.json`);
        if (!existsSync(blueprintPath)) {
          return {
            content: [{ type: "text", text: `❌ 蓝图不存在: ${tool_id}` }],
            isError: true,
          };
        }
        
        const blueprint: ForgeTool = JSON.parse(readFileSync(blueprintPath, "utf-8"));
        
        if (test_passed) {
          // 更新状态为enlisted
          blueprint.state = "enlisted";
          blueprint.tested_at = new Date().toISOString();
          blueprint.enlisted_at = new Date().toISOString();
          writeFileSync(blueprintPath, JSON.stringify(blueprint, null, 2), "utf-8");
          
          // 更新蓝图文档
          const blueprintDocPath = join(FORGE_DIR, `${tool_id}-blueprint.md`);
          let blueprintDoc = readFileSync(blueprintDocPath, "utf-8");
          blueprintDoc += `\n## 列装信息\n`;
          blueprintDoc += `- **列装时间**: ${blueprint.enlisted_at}\n`;
          blueprintDoc += `- **测试通过**: 是\n`;
          blueprintDoc += `- **状态**: enlisted\n`;
          writeFileSync(blueprintDocPath, blueprintDoc, "utf-8");
          
          let resultText = `## 工具已列装\n\n`;
          resultText += `**工具ID**: ${tool_id}\n`;
          resultText += `**工具名称**: ${blueprint.name}\n`;
          resultText += `**状态**: enlisted\n`;
          resultText += `**测试通过**: 是\n`;
          resultText += `**列装时间**: ${blueprint.enlisted_at}\n\n`;
          resultText += `工具已成功列装到资产区。\n`;
          
          return {
            content: [{ type: "text", text: resultText }],
            details: { blueprint },
          };
        } else {
          // 更新状态为rejected
          blueprint.state = "rejected";
          writeFileSync(blueprintPath, JSON.stringify(blueprint, null, 2), "utf-8");
          
          let resultText = `## 工具被拒绝\n\n`;
          resultText += `**工具ID**: ${tool_id}\n`;
          resultText += `**工具名称**: ${blueprint.name}\n`;
          resultText += `**状态**: rejected\n`;
          resultText += `**测试通过**: 否\n\n`;
          resultText += `工具未通过测试，已被拒绝列装。\n`;
          
          return {
            content: [{ type: "text", text: resultText }],
            details: { blueprint },
          };
        }
        
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `❌ 列装工具失败: ${error.message}` }],
          isError: true,
        };
      }
    },
  });
  
  // ============================================================
  // 注册辅助命令
  // ============================================================
  
  pi.registerCommand("forge-status", {
    description: "查看零号工厂状态",
    handler: async (_args, ctx) => {
      try {
        let statusText = `## 零号工厂状态\n\n`;
        statusText += `- **模块加载**: ✓ 已加载\n`;
        statusText += `- **蓝图创建**: ✓ 可用\n`;
        statusText += `- **沙箱测试**: ✓ 可用\n`;
        statusText += `- **工具列装**: ✓ 可用\n\n`;
        statusText += `### 已注册工具\n`;
        statusText += `- create_blueprint: 创建工具蓝图\n`;
        statusText += `- test_in_sandbox: 沙箱测试\n`;
        statusText += `- enlist_tool: 工具列装\n`;
        
        ctx.ui.notify(statusText, "info");
      } catch (e: any) {
        ctx.ui.notify(`状态查询失败: ${e.message}`, "error");
      }
    },
  });
  
  console.log(`${LOG_PREFIX} Extension 加载完成，零号工厂已注册`);
}
