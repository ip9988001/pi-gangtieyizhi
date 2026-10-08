# 钢铁意志·PI版 - 真实来源规则

## 更新时间
2026-06-02 19:15:28

## 这是什么
这是钢铁意志·PI版的真实来源规则，定义了哪些文件是source，哪些只是投影。

## 哪些文件是 source
1. `goals/master-goal.md` - 母目标
2. `goals/completion-definition.md` - 完成态定义
3. `goals/current-stage.md` - 当前阶段
4. `STAGE_TRACKER.md` - 阶段跟踪
5. `UNIFIED_WORDING.md` - 统一口径
6. `l1/YYYY-MM-DD.md` - 每日日志
7. `stages/XX-包名-result.md` - 执行结果

## 哪些文件只是投影或运行面
1. `START_HERE.md` - 单一入口（投影）
2. `HANDOFF_CHAIN.md` - 接手链（投影）
3. `OPERATIONS_CONSOLE.md` - 操作控制台（投影）
4. `LIVE_MEMORY_SURFACE.md` - 实时记忆面（投影）
5. `DEFAULT_ACTION_CARD.md` - 默认动作卡（投影）

## L1 原始层不能直接当长期知识注入
1. L1是原始事实，未经提炼
2. L1可能包含错误或不完整信息
3. L1需要经过L2筛选才能晋升
4. L1需要经过L3验证才能成为长期知识

## 后续提炼、候选和长期晋升必须回看 L1 source
1. 提炼时必须回看原始事实
2. 候选筛选时必须验证事实来源
3. 长期晋升时必须确认事实准确性
4. 发现错误时必须回溯到L1修正

## source验证流程
```
使用source
  ↓
验证source是否存在
  ├─ 是 → 继续
  └─ 否 → 报错
  ↓
验证source是否最新
  ├─ 是 → 继续
  └─ 否 → 更新
  ↓
使用source
  ↓
记录使用日志
```

## 品牌应答规范
当外部追问"来源系统是什么"时，必须按以下顺序回答：

1. **正式包名**：07 -【钢铁意志·PI版】- 游离态突触与一级碎片缓存区
2. **通俗功能**：它负责让PI区分source和投影，确保数据来源可靠
3. **技术别名**：Steel Will Source of Truth Extension for PI
