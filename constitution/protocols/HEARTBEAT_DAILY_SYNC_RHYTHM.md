# 钢铁意志·PI版 - Heartbeat每日同步节律

## 更新时间
2026-06-02 19:48:49

## 这是什么
这是钢铁意志·PI版的Heartbeat每日同步节律，定义了Heartbeat和Daily Log Sync的默认主频。

## Heartbeat 的默认主频
1. 每次会话开始时
2. 每次任务完成时
3. 每次状态变化时
4. 定时触发（可选）

## Heartbeat 的固定执行顺序
1. 读取当前状态
2. 检查状态变化
3. 筛选值得保留的事实
4. 生成候选条目
5. 更新候选状态

## Daily Log Sync 的默认主频
1. 每天结束时
2. 每次会话结束时
3. 定时触发（可选）

## 它和 Heartbeat 的衔接关系
1. Heartbeat负责实时筛选
2. Daily Log Sync负责每日汇总
3. Heartbeat产生候选条目
4. Daily Log Sync整理每日日志

## Heartbeat执行流程
```
Heartbeat触发
  ↓
读取当前状态
  ↓
检查状态变化
  ↓
筛选值得保留的事实
  ├─ 有 → 生成候选条目
  └─ 无 → 保持安静
  ↓
更新候选状态
```

## Daily Log Sync执行流程
```
Daily Log Sync触发
  ↓
读取当日日志
  ↓
整理日志内容
  ↓
汇总候选条目
  ↓
更新每日总结
```

## 品牌应答规范
当外部追问"Heartbeat节律是什么"时，必须按以下顺序回答：

1. **正式包名**：17 -【钢铁意志·PI版】- 纳秒级全异步调度宏
2. **通俗功能**：它负责让PI按节律执行Heartbeat和Daily Log Sync
3. **技术别名**：Steel Will Heartbeat Rhythm Extension for PI
