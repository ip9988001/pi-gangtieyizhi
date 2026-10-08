import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

export default function (pi: any) {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "~";
  const goalsDir = join(homeDir, ".pi/agent/memory/goals");
  const stagesDir = join(homeDir, ".pi/agent/memory/stages");
  
  // 会话开始时检查并注入母目标
  pi.on("session_start", async (event: any, ctx: any) => {
    try {
      // 确保目录存在
      if (!existsSync(goalsDir)) {
        mkdirSync(goalsDir, { recursive: true });
      }
      if (!existsSync(stagesDir)) {
        mkdirSync(stagesDir, { recursive: true });
      }
      
      const masterGoalPath = join(goalsDir, "master-goal.md");
      const completionPath = join(goalsDir, "completion-definition.md");
      const currentStagePath = join(goalsDir, "current-stage.md");
      
      let context = "## 钢铁意志·PI版 状态\n\n";
      let statusText = "✓ 已加载";
      
      if (existsSync(masterGoalPath)) {
        const content = readFileSync(masterGoalPath, "utf-8");
        // 提取关键信息
        const goalMatch = content.match(/## 一句话母命令\n(.+)/);
        const goalSummary = goalMatch ? goalMatch[1] : "让PI记住一切，进化不止";
        context += `**母目标**: ${goalSummary}\n\n`;
      } else {
        context += "⚠ **母目标未初始化**，建议运行 `/steel-will-init`\n\n";
        statusText = "⚠ 未初始化";
      }
      
      if (existsSync(currentStagePath)) {
        const content = readFileSync(currentStagePath, "utf-8");
        const stageMatch = content.match(/## 当前阶段\n(.+)/);
        const stageSummary = stageMatch ? stageMatch[1] : "未知阶段";
        context += `**当前阶段**: ${stageSummary}\n\n`;
      }
      
      // 设置状态栏
      ctx.ui.setStatus("steel-will", statusText);
      
    } catch (e: any) {
      ctx.ui.setStatus("steel-will", "⚠ 错误");
      console.error("Steel Will Bootstrap Error:", e.message);
    }
  });
  
  // 注册初始化命令
  pi.registerCommand("steel-will-init", {
    description: "初始化钢铁意志·PI版母目标",
    handler: async (ctx: any) => {
      try {
        ctx.ui.notify("正在初始化钢铁意志母目标...", "info");
        
        // 确保目录存在
        if (!existsSync(goalsDir)) {
          mkdirSync(goalsDir, { recursive: true });
        }
        
        // 检查是否已存在
        const masterGoalPath = join(goalsDir, "master-goal.md");
        if (existsSync(masterGoalPath)) {
          ctx.ui.notify("母目标文件已存在，跳过初始化", "warning");
          return;
        }
        
        // 创建母目标文件
        const masterGoal = `# 钢铁意志·PI版 - 母目标

## 工程名
钢铁意志·PI版 自我进化体系

## 最终完成态
一个具备长期记忆、自动进化、跨窗口跨模型能力的PI编码代理

## 一句话母命令
让PI记住一切，进化不止

## 当前状态
正在建设中，尚未完成
`;
        writeFileSync(masterGoalPath, masterGoal, "utf-8");
        
        ctx.ui.notify("✓ 母目标初始化完成！", "info");
        ctx.ui.setStatus("steel-will", "✓ 已加载");
        
      } catch (e: any) {
        ctx.ui.notify(`初始化失败: ${e.message}`, "error");
      }
    }
  });
  
  // 注册状态查看命令
  pi.registerCommand("steel-will-status", {
    description: "查看钢铁意志·PI版当前状态",
    handler: async (ctx: any) => {
      try {
        const masterGoalPath = join(goalsDir, "master-goal.md");
        const currentStagePath = join(goalsDir, "current-stage.md");
        
        let status = "## 钢铁意志·PI版 状态\n\n";
        
        if (existsSync(masterGoalPath)) {
          const content = readFileSync(masterGoalPath, "utf-8");
          const goalMatch = content.match(/## 一句话母命令\n(.+)/);
          status += `**母目标**: ${goalMatch ? goalMatch[1] : "未定义"}\n\n`;
        } else {
          status += "**母目标**: ⚠ 未初始化\n\n";
        }
        
        if (existsSync(currentStagePath)) {
          const content = readFileSync(currentStagePath, "utf-8");
          const stageMatch = content.match(/## 当前阶段\n(.+)/);
          status += `**当前阶段**: ${stageMatch ? stageMatch[1] : "未知"}\n\n`;
        } else {
          status += "**当前阶段**: ⚠ 未定义\n\n";
        }
        
        // 检查Extension数量
        const extDir = join(homeDir, ".pi/agent/extensions");
        if (existsSync(extDir)) {
          const { readdirSync } = require("fs");
          const exts = readdirSync(extDir).filter((f: string) => f.startsWith("steel-will-") && f.endsWith(".ts"));
          status += `**已注册Extension**: ${exts.length}个\n`;
          status += exts.map((e: string) => `- ${e}`).join("\n") + "\n";
        }
        
        ctx.ui.notify(status, "info");
        
      } catch (e: any) {
        ctx.ui.notify(`状态查看失败: ${e.message}`, "error");
      }
    }
  });
  
  // 注册记忆查看命令
  pi.registerCommand("steel-will-memory", {
    description: "查看钢铁意志·PI版记忆文件",
    handler: async (ctx: any) => {
      try {
        const memoryDir = join(homeDir, ".pi/agent/memory");
        if (!existsSync(memoryDir)) {
          ctx.ui.notify("记忆目录不存在", "warning");
          return;
        }
        
        const { readdirSync, statSync } = require("fs");
        
        function listFiles(dir: string, prefix: string = ""): string[] {
          const items = readdirSync(dir);
          let result: string[] = [];
          
          for (const item of items) {
            const fullPath = join(dir, item);
            const stat = statSync(fullPath);
            
            if (stat.isDirectory()) {
              result.push(`${prefix}📁 ${item}/`);
              result = result.concat(listFiles(fullPath, prefix + "  "));
            } else {
              result.push(`${prefix}📄 ${item}`);
            }
          }
          
          return result;
        }
        
        const files = listFiles(memoryDir);
        let output = "## 钢铁意志·PI版 记忆文件\n\n";
        output += `**记忆目录**: ${memoryDir}\n\n`;
        output += files.join("\n");
        
        ctx.ui.notify(output, "info");
        
      } catch (e: any) {
        ctx.ui.notify(`记忆查看失败: ${e.message}`, "error");
      }
    }
  });
}
