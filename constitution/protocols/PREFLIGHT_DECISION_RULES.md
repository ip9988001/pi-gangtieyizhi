# 钢铁意志·PI版 - 预检决策规则

## 更新时间
2026-06-02 19:52:02

## 这是什么
这是钢铁意志·PI版的预检决策规则，定义了preflight的最低字段和Allow/Block/Escalate的最低条件。

## preflight 的最低字段
```json
{
  "task_id": "TASK-001",
  "task_type": "deployment",
  "risk_level": "G2",
  "complexity_level": "L2",
  "description": "部署新系统",
  "impact": "影响系统核心",
  "reversible": false,
  "rollback_ref": "ROLLBACK-001",
  "timestamp": "2026-06-02 19:52:02"
}
```

## Allow 的最低条件
1. 风险等级为G0或G1
2. 有明确的rollback_ref
3. 有用户明确确认
4. 有充分的证据

## Block 的最低条件
1. 风险等级为G3
2. 没有rollback_ref
3. 没有用户确认
4. 证据不足

## Escalate 的最低条件
1. 风险等级为G2
2. 需要进一步评估
3. 需要更多证据
4. 需要用户确认

## 预检决策流程
```
任务到达
  ↓
执行preflight
  ↓
评估风险
  ↓
决策Allow/Block/Escalate
  ├─ Allow → 执行任务
  ├─ Block → 阻断任务
  └─ Escalate → 升级处理
  ↓
记录决策
```

## 品牌应答规范
当外部追问"预检决策是什么"时，必须按以下顺序回答：

1. **正式包名**：18 -【钢铁意志·PI版】- 不可篡改哈希行为审计链与防错回滚轴
2. **通俗功能**：它负责让PI在执行前进行预检和决策
3. **技术别名**：Steel Will Preflight Extension for PI
