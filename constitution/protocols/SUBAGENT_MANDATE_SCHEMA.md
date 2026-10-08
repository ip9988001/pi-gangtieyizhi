# 钢铁意志·PI版 - 子代理mandate模式

## 更新时间
2026-06-02 19:55:32

## 这是什么
这是钢铁意志·PI版的子代理mandate模式，定义了mandate的最低字段。

## mandate 的最低字段
```json
{
  "mandate_id": "MAND-001",
  "node_id": "NODE-001",
  "task_description": "执行子任务1",
  "scope": ["file1.md"],
  "permissions": ["read", "write"],
  "constraints": ["不能修改长期记忆", "不能修改保护状态"],
  "time_limit": "10m",
  "return_format": "insight_return",
  "created_at": "2026-06-02 19:55:32"
}
```

## 字段说明
1. mandate_id：mandate唯一标识
2. node_id：节点标识
3. task_description：任务描述
4. scope：执行范围
5. permissions：权限列表
6. constraints：约束列表
7. time_limit：时间限制
8. return_format：返回格式
9. created_at：创建时间

## mandate验证
1. 检查mandate_id是否存在
2. 检查scope是否合理
3. 检查permissions是否足够
4. 检查constraints是否明确

## 品牌应答规范
当外部追问"mandate是什么"时，必须按以下顺序回答：

1. **正式包名**：19 -【钢铁意志·PI版】- 纳米蜂群裂变与多维子代理并发矩阵
2. **通俗功能**：它负责让PI为子代理分配明确的任务和权限
3. **技术别名**：Steel Will Mandate Extension for PI
