# 钢铁意志·PI版 - 包26：自发式编排与动态重规划算力栈

## 正式包名
26 -【钢铁意志·PI版】- 自发式编排与动态重规划算力栈

## 通俗功能
潜意识增强链、反射路由、慢链下沉

## 技术别名
Steel Will Subconscious & Reflex Router

## 触发条件
当需要：
- 检查动作是否符合反射条件
- 记录反射事件
- 检查反射区状态

## 已注册工具

### 1. check_reflex_eligibility
检查动作是否符合反射条件。

**反射条件**：
- 风险等级必须是low
- 执行频次必须≥5次
- 成功率必须≥80%

**状态流转**：
- observed → candidate → compilable → active

### 2. record_reflex_event
记录反射事件到账本。

**事件类型**：
- hit: 反射命中
- miss: 反射未命中
- blocked: 反射被阻断
- fallback: 反射退回主链
- retired: 反射退役

**账本位置**: `~/.pi/agent/memory/system/subconscious/reflex_event_ledger.jsonl`

### 3. check_reflex_status
检查反射区状态。

**状态分布**：
- observed: 观察中
- candidate: 候选
- compilable: 可编译
- active: 活跃
- cooldown: 冷却中
- retired: 已退役

## 已注册命令

### /subconscious-status
查看潜意识模块状态

## 反射路由规则

### 反射区定位
- 反射区位于入口前段，但不替代主链
- 只处理低风险高频动作
- 反射失败必须退回主链

### 反射条件
1. **风险等级**: 必须是low
2. **执行频次**: 必须≥5次
3. **成功率**: 必须≥80%

### 反射状态流转
```
observed → candidate → compilable → active
    ↓           ↓           ↓          ↓
  退役       退役        退役       冷却/退役
```

## 反射编译规则

### 慢链下沉到快链
1. **观察**: 动作在主链执行，收集数据
2. **候选**: 动作频次≥5，进入候选池
3. **可编译**: 动作成功率≥80%，可编译
4. **活跃**: 编译完成，进入反射区

### 编译阈值
- 频次阈值: ≥5次
- 成功率阈值: ≥80%
- 风险阈值: 必须是low

## 使用场景

1. **动作执行前**：调用check_reflex_eligibility检查是否符合反射条件
2. **反射执行后**：调用record_reflex_event记录事件
3. **定期检查**：调用check_reflex_status检查反射区状态
