/**
 * 钢铁意志·PI版 - 历史记忆重载脚本 (Backfill)
 * 
 * 功能：将已有的 L1 和 L3 文本记忆全部转化为高维向量，存入 Vectra 数据库
 * 
 * 执行方式：npx tsx scripts/vectorize_history.ts
 * 
 * 注意事项：
 * 1. 首次运行会下载约 80MB 的模型权重，可能需要几十秒到几分钟
 * 2. 脚本会显示详细的进度信息，避免看起来像卡死
 * 3. 单个文件超过 2000 字符时会按段落切块
 */

import semanticRetrievalService from "../services/steel-will-semantic-retrieval.ts";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { homedir } from "os";

// ============================================================
// 配置常量
// ============================================================

const HOME_DIR = homedir();
const MEMORY_DIR = join(HOME_DIR, ".pi", "agent", "memory");

// L1 目录
const L1_DIR = join(MEMORY_DIR, "l1");

// L3 目录列表
const L3_DIRECTORIES = [
  "decisions",
  "lessons",
  "cases",
  "patterns",
  "projects",
  "anti-patterns",
  "actions",
  "reflections"
];

// 切块阈值（字符数）
const CHUNK_THRESHOLD = 2000;

// ============================================================
// 辅助函数
// ============================================================

/**
 * 递归获取目录下所有 .md 文件
 */
function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!existsSync(dir)) {
    return files;
  }
  
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 递归遍历子目录
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (item.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 按段落切块文本
 * 
 * 如果文本超过阈值，按段落（空行分隔）切块
 * 如果单个段落仍然超过阈值，按固定长度切块
 */
function chunkText(text: string, threshold: number = CHUNK_THRESHOLD): string[] {
  // 如果文本小于阈值，直接返回
  if (text.length <= threshold) {
    return [text];
  }
  
  const chunks: string[] = [];
  
  // 按段落切分（空行分隔）
  const paragraphs = text.split(/\n\s*\n/);
  
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    if (!trimmedParagraph) {
      continue;
    }
    
    // 如果当前块加上新段落超过阈值
    if (currentChunk && (currentChunk.length + trimmedParagraph.length + 2) > threshold) {
      // 保存当前块
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    
    // 如果单个段落超过阈值，按固定长度切块
    if (trimmedParagraph.length > threshold) {
      // 先保存当前块
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      
      // 按固定长度切块
      let remaining = trimmedParagraph;
      while (remaining.length > 0) {
        const chunk = remaining.substring(0, threshold);
        chunks.push(chunk);
        remaining = remaining.substring(threshold);
      }
    } else {
      // 添加到当前块
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
    }
  }
  
  // 保存最后一块
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [text];
}

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * 格式化时间（毫秒）
 */
function formatTime(ms: number): string {
  if (ms < 1000) return ms + "ms";
  if (ms < 60 * 1000) return (ms / 1000).toFixed(1) + "s";
  return (ms / (60 * 1000)).toFixed(1) + "min";
}

/**
 * 创建进度条
 */
function createProgressBar(current: number, total: number, width: number = 30): string {
  const percent = Math.floor((current / total) * 100);
  const filled = Math.floor((current / total) * width);
  const empty = width - filled;
  
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `[${bar}] ${percent}% (${current}/${total})`;
}

// ============================================================
// 主函数
// ============================================================

async function main() {
  const startTime = Date.now();
  
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   钢铁意志·PI版 - 历史记忆重载脚本 (Backfill)            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
  
  // ----------------------------------------------------------
  // 第一步：收集所有需要处理的文件
  // ----------------------------------------------------------
  console.log("📁 [步骤 1/4] 收集文件列表...");
  console.log("");
  
  const allFiles: { path: string; type: 'l1' | 'l3'; category: string }[] = [];
  
  // 收集 L1 文件
  const l1Files = getAllMarkdownFiles(L1_DIR);
  for (const file of l1Files) {
    allFiles.push({
      path: file,
      type: 'l1',
      category: 'l1'
    });
  }
  console.log(`  ✅ L1 目录: ${l1Files.length} 个文件`);
  
  // 收集 L3 文件
  for (const dir of L3_DIRECTORIES) {
    const dirPath = join(MEMORY_DIR, "agent", dir);
    const files = getAllMarkdownFiles(dirPath);
    for (const file of files) {
      allFiles.push({
        path: file,
        type: 'l3',
        category: dir
      });
    }
    console.log(`  ✅ L3/${dir}: ${files.length} 个文件`);
  }
  
  console.log("");
  console.log(`  📊 总计: ${allFiles.length} 个文件待处理`);
  console.log("");
  
  if (allFiles.length === 0) {
    console.log("⚠️  未找到任何 .md 文件，脚本结束。");
    return;
  }
  
  // ----------------------------------------------------------
  // 第二步：初始化语义检索引擎
  // ----------------------------------------------------------
  console.log("🚀 [步骤 2/4] 初始化语义检索引擎...");
  console.log("");
  console.log("  ⏳ 正在加载模型和初始化向量数据库...");
  console.log("  💡 首次运行会下载约 80MB 的模型权重，请耐心等待...");
  console.log("");
  
  const initStartTime = Date.now();
  
  try {
    await semanticRetrievalService.init();
    const initTime = Date.now() - initStartTime;
    console.log(`  ✅ 引擎初始化完成 (耗时: ${formatTime(initTime)})`);
  } catch (error: any) {
    console.error(`  ❌ 引擎初始化失败: ${error.message}`);
    process.exit(1);
  }
  
  console.log("");
  
  // ----------------------------------------------------------
  // 第三步：遍历并向量化所有文件
  // ----------------------------------------------------------
  console.log("📝 [步骤 3/4] 开始向量化历史记忆...");
  console.log("");
  
  let successCount = 0;
  let failCount = 0;
  let chunkCount = 0;
  
  const processStartTime = Date.now();
  
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const progress = createProgressBar(i + 1, allFiles.length);
    
    try {
      // 读取文件内容
      const content = readFileSync(file.path, "utf-8");
      
      // 计算相对路径
      const relativePath = relative(MEMORY_DIR, file.path);
      
      // 显示进度
      process.stdout.write(`\r  ${progress} | 正在处理: ${relativePath.substring(0, 40).padEnd(40)}`);
      
      // 切块
      const chunks = chunkText(content, CHUNK_THRESHOLD);
      chunkCount += chunks.length;
      
      // 向量化每个块
      for (let j = 0; j < chunks.length; j++) {
        const chunk = chunks[j];
        
        const metadata = {
          filePath: file.path,
          memoryType: file.type,
          createdAt: new Date().toISOString(),
          tags: [file.category, `chunk-${j + 1}-of-${chunks.length}`],
        };
        
        await semanticRetrievalService.addMemory(chunk, metadata);
      }
      
      successCount++;
      
    } catch (error: any) {
      failCount++;
      console.log("");
      console.log(`  ❌ 处理失败: ${file.path}`);
      console.log(`     错误: ${error.message}`);
    }
  }
  
  const processTime = Date.now() - processStartTime;
  
  console.log("");
  console.log("");
  console.log(`  ✅ 向量化完成`);
  console.log(`     成功: ${successCount} 个文件`);
  console.log(`     失败: ${failCount} 个文件`);
  console.log(`     切块: ${chunkCount} 个块`);
  console.log(`     耗时: ${formatTime(processTime)}`);
  console.log("");
  
  // ----------------------------------------------------------
  // 第四步：验证并输出统计信息
  // ----------------------------------------------------------
  console.log("📊 [步骤 4/4] 验证并输出统计信息...");
  console.log("");
  
  try {
    const status = await semanticRetrievalService.getStatus();
    const stats = await semanticRetrievalService.getIndexStats();
    
    console.log("  ╔══════════════════════════════════════════════════════╗");
    console.log("  ║              向量数据库统计信息                      ║");
    console.log("  ╠══════════════════════════════════════════════════════╣");
    console.log(`  ║  初始化状态: ${status.initialized ? '✅ 已初始化' : '❌ 未初始化'}                          ║`);
    console.log(`  ║  模型状态:   ${status.modelLoaded ? '✅ 已加载' : '❌ 未加载'}                          ║`);
    console.log(`  ║  索引状态:   ${status.indexCreated ? '✅ 已创建' : '❌ 未创建'}                          ║`);
    console.log(`  ║  记忆条目:   ${String(status.itemCount).padEnd(6)} 条                              ║`);
    if (stats) {
      console.log(`  ║  向量维度:   ${String(stats.dimensions).padEnd(6)} 维                              ║`);
    }
    console.log("  ╚══════════════════════════════════════════════════════╝");
    console.log("");
    
    // 最终战报
    const totalTime = Date.now() - startTime;
    
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                    🎉 最终战报 🎉                        ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log(`║  处理文件数: ${String(successCount).padEnd(6)} 个                                    ║`);
    console.log(`║  向量块数:   ${String(chunkCount).padEnd(6)} 个                                    ║`);
    console.log(`║  数据库条目: ${String(status.itemCount).padEnd(6)} 条                                    ║`);
    console.log(`║  总耗时:     ${formatTime(totalTime).padEnd(10)}                                      ║`);
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log("✅ 历史记忆重载完成！语义检索引擎已就绪。");
    console.log("");
    
  } catch (error: any) {
    console.error(`  ❌ 获取统计信息失败: ${error.message}`);
  }
}

// ============================================================
// 执行入口
// ============================================================

main().catch((error) => {
  console.error("❌ 脚本执行失败:", error);
  process.exit(1);
});
