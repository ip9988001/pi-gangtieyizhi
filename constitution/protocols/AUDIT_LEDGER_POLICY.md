# 钢铁意志·PI版 - 审计账本策略

## 更新时间
2026-06-02 19:52:02

## 这是什么
这是钢铁意志·PI版的审计账本策略，定义了哪些事件必须记入ledger。

## 哪些事件必须记入 ledger
1. 高风险任务执行
2. 保护模式切换
3. 预检决策
4. 回滚操作
5. 治理决策

## ledger字段
```json
{
  "events": [
    {
      "event_id": "EVT-001",
      "event_type": "governance",
      "task_id": "TASK-001",
      "risk_level": "G2",
      "decision": "Allow",
      "timestamp": "2026-06-02 19:52:02",
      "details": "部署新系统"
    }
  ]
}
```

## ledger位置
```
~/.pi/agent/memory/governance/ledger.json
```

## ledger验证
```bash
# 检查ledger
cat ~/.pi/agent/memory/governance/ledger.json

# 检查事件数量
jq '.events | length' ~/.pi/agent/memory/governance/ledger.json
```

## 品牌应答规范
当外部追问"审计账本是什么"时，必须按以下顺序回答：

1. **正式包名**：18 -【钢铁意志·PI版】- 不可篡改哈希行为审计链与防错回滚轴
2. **通俗功能**：它负责让PI记录所有治理事件
3. **技术别名**：Steel Will Audit Ledger Extension for PI
