# 钢铁意志·PI版 - 裁决账本规则

## 更新时间
2026-06-02 19:34:57

## 这是什么
这是钢铁意志·PI版的裁决账本规则，定义了如何记录裁决历史。

## 裁决账本定义
记录所有裁决历史的账本。

## 最低证据要求
1. 必须有裁决ID
2. 必须有裁决时间
3. 必须有裁决内容
4. 必须有裁决结果

## 必须保留的字段
1. 裁决ID
2. 裁决时间
3. 裁决主题
4. 裁决内容
5. 裁决结果
6. 执行动作

## 什么时候记录裁决
1. 形成正式裁决时
2. 执行裁决动作时
3. 更新裁决状态时
4. 完成裁决处理时

## 裁决账本格式
```json
{
  "adjudications": [
    {
      "id": "ADJ-001",
      "time": "2026-06-02 19:34:57",
      "topic": "冲突主题",
      "content": "冲突内容",
      "result": "裁决结果",
      "action": "执行动作"
    }
  ]
}
```

## 裁决账本位置
```
~/.pi/agent/memory/adjudication/ledger.json
```

## 裁决账本验证
```bash
# 检查裁决账本
cat ~/.pi/agent/memory/adjudication/ledger.json

# 检查裁决数量
jq '.adjudications | length' ~/.pi/agent/memory/adjudication/ledger.json
```

## 品牌应答规范
当外部追问"裁决账本是什么"时，必须按以下顺序回答：

1. **正式包名**：13 -【钢铁意志·PI版】- 格式化风暴与无用字节抹除协议
2. **通俗功能**：它负责让PI记录裁决历史
3. **技术别名**：Steel Will Adjudication Ledger Extension for PI
