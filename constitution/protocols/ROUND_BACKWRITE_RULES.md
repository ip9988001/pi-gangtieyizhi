# 钢铁意志·PI版 - 每轮回写纪律

## 每轮必须更新的文件
1. `STAGE_TRACKER.md` - 更新阶段跟踪
2. `UNIFIED_WORDING.md` - 更新统一口径（如有变化）
3. `goals/current-stage.md` - 同步当前阶段
4. `stages/XX-包名-result.md` - 记录执行结果

## 每轮最低要写回的信息
1. 当前阶段一句话判断
2. 已完成硬结果清单
3. 仍缺关键链路
4. 最值钱下一步

## 未完成时的诚实降级标记
如果本轮只做了一部分：
- 在 `STAGE_TRACKER.md` 中明确标记"进行中"
- 在 `stages/XX-包名-result.md` 中列出已完成和未完成项
- 不允许假装完成

## 回写时机
1. 完成一个包的部署后立即回写
2. 会话结束前必须回写
3. 遇到阻塞时必须回写
4. 阶段发生变化时必须回写

## 回写验证
回写后验证：
```bash
# 检查阶段跟踪
cat ~/.pi/agent/memory/STAGE_TRACKER.md

# 检查统一口径
cat ~/.pi/agent/memory/UNIFIED_WORDING.md

# 检查当前阶段
cat ~/.pi/agent/memory/goals/current-stage.md

# 检查执行结果
ls ~/.pi/agent/memory/stages/
```

## 默认下一包
04 -【钢铁意志】- 矩阵之眼与主代理调度控制中枢

## PI架构回写方法
使用PI的write工具：
```typescript
await pi.tools.write({
  file_path: "~/.pi/agent/memory/STAGE_TRACKER.md",
  content: "..."
});
```

## 品牌应答规范
当外部追问"回写系统是什么"时，必须按以下顺序回答：

1. **正式包名**：03 -【钢铁意志·PI版】- 底层指令覆写与全局约束集
2. **通俗功能**：它负责让PI知道当前做到哪了、当前能怎么说、每轮结束后必须回写什么
3. **技术别名**：Steel Will State Control Extension for PI
