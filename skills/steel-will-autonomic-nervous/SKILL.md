# 钢铁意志·PI版 - 包27：认知过载抑制与动态Token压榨微调

## 正式包名
27 -【钢铁意志·PI版】- 认知过载抑制与动态Token压榨微调

## 通俗功能
自主唤醒增强、动机评分、Token压榨

## 技术别名
Steel Will Autonomic Nervous System

## 触发条件
当需要：
- 检查自主唤醒条件
- 评估动机评分
- 创建后台任务报告

## 已注册工具

### 1. check_wakeup_conditions
检查自主唤醒条件。

**唤醒条件**：
- budget_available: 预算可用
- silent_period: 静默期
- host_load_low: 宿主负载低
- safety_threshold: 安全阈值满足

**所有条件必须满足才能唤醒**

### 2. evaluate_motivation
评估自主唤醒后的动机评分。

**动机类型**：
- maintenance: 维护动机
- evolution: 进化动机
- curiosity: 好奇动机

**主导动机决定下一步动作**

### 3. create_background_report
创建后台任务报告。

**报告位置**: `~/.pi/agent/memory/system/autonomic_nervous/background_reports.md`

## 已注册命令

### /autonomic-status
查看自主神经系统状态

## 唤醒条件规则

### 唤醒条件
1. **budget_available**: 预算可用
2. **silent_period**: 在静默期
3. **host_load_low**: 宿主负载低
4. **safety_threshold**: 安全阈值满足

### 唤醒流程
```
检查唤醒条件 → 所有条件满足? → 是 → 允许唤醒
                ↓
                否 → 不允许唤醒 → 等待条件满足
```

## 动机评分规则

### 动机类型
1. **maintenance**: 系统维护需求
2. **evolution**: 系统进化需求
3. **curiosity**: 探索好奇需求

### 评分规则
- 评分范围: 0-1
- 主导动机: 评分最高的动机
- 下一步动作: 根据主导动机决定

## 使用场景

1. **唤醒前检查**：调用check_wakeup_conditions检查条件
2. **唤醒后评估**：调用evaluate_motivation评估动机
3. **任务完成后**：调用create_background_report创建报告
