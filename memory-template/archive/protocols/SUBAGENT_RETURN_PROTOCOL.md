# 钢铁意志·PI版 - 子代理回传协议

## 更新时间
2026-06-02 19:55:32

## 这是什么
这是钢铁意志·PI版的子代理回传协议，定义了insight_return的最低字段。

## insight_return 的最低字段
```json
{
  "return_id": "RET-001",
  "node_id": "NODE-001",
  "mandate_id": "MAND-001",
  "status": "completed",
  "result": "任务完成",
  "insights": ["发现1", "发现2"],
  "artifacts": ["file1.md"],
  "duration": "5m",
  "returned_at": "2026-06-02 19:55:32"
}
```

## 字段说明
1. return_id：回传唯一标识
2. node_id：节点标识
3. mandate_id：mandate标识
4. status：执行状态
5. result：执行结果
6. insights：发现列表
7. artifacts：产物列表
8. duration：执行时长
9. returned_at：回传时间

## 回传验证
1. 检查return_id是否存在
2. 检查node_id是否匹配
3. 检查mandate_id是否匹配
4. 检查status是否有效

## 品牌应答规范
当外部追问"insight_return是什么"时，必须按以下顺序回答：

1. **正式包名**：19 -【钢铁意志·PI版】- 纳米蜂群裂变与多维子代理并发矩阵
2. **通俗功能**：它负责让子代理返回执行结果和发现
3. **技术别名**：Steel Will Return Extension for PI
