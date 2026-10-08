# 可信记忆元数据规范

## 可信元数据定义

可信元数据是记忆条目的"身份证"，用于判断条目是否可信、是否可注入、是否需要验证。

## 必填字段

### 1. anchor_refs (锚点引用)
- **类型**: string[]
- **说明**: 条目的来源锚点，如对话ID、文件路径、事件引用
- **最低要求**: 至少1个锚点
- **无锚点降级**: 无锚点的条目只能作为参考，不可作为可信依据

### 2. confidence (置信度)
- **类型**: number (0-1)
- **说明**: 条目的可信程度
- **分档**:
  - 0.9-1.0: 高置信度，可直接使用
  - 0.7-0.9: 中置信度，建议验证
  - 0.5-0.7: 低置信度，仅作参考
  - <0.5: 极低置信度，不建议使用

### 3. last_verified (最后验证时间)
- **类型**: ISO 8601 时间戳
- **说明**: 条目最后一次被验证的时间
- **更新时机**: 条目被成功使用或验证后

### 4. freshness (新鲜度)
- **类型**: "fresh" | "stale" | "unverified"
- **说明**: 条目的新鲜程度
- **分档**:
  - fresh: 最近验证过，可信任
  - stale: 较久未验证，需要验证
  - unverified: 从未验证，谨慎使用

### 5. state (状态)
- **类型**: "active" | "deprecated" | "conflict" | "pending"
- **说明**: 条目的当前状态
- **分档**:
  - active: 活跃可用
  - deprecated: 已废弃，不建议使用
  - conflict: 存在冲突，需要裁决
  - pending: 待处理

### 6. owner (所有者)
- **类型**: "user" | "agent" | "system"
- **说明**: 条目的来源

### 7. summary (摘要)
- **类型**: string
- **说明**: 条目的简短摘要，不超过200字

### 8. keywords (关键词)
- **类型**: string[]
- **说明**: 用于检索的关键词

### 9. aliases (别名)
- **类型**: string[]
- **说明**: 条目的别名，用于中文语境下的同义词检索

### 10. read_hint (读取提示)
- **类型**: string
- **说明**: 读取该条目时的提示信息

## 可选字段

- `related_entries`: 关联条目ID列表
- `supersedes`: 被该条目取代的旧条目ID
- `tags`: 标签列表
- `priority`: 优先级

## 使用规则

1. **写入L3前必须检查**: 所有必填字段必须存在
2. **写入L2前建议检查**: 至少包含anchor_refs、confidence、state
3. **L1碎片可简化**: 允许暂缺部分字段，但必须有基本元数据
4. **无锚点降级**: 无anchor_refs的条目不可作为可信依据

## 可信元数据示例

```yaml
summary: "永远不要在半夜2点后执行微服务重启"
keywords: ["微服务", "重启", "半夜", "事故"]
aliases: ["夜间重启教训", "凌晨操作禁忌"]
anchor_refs: ["agent/lessons/night-restart-lesson.md"]
confidence: 0.98
last_verified: "2026-06-03T03:20:00Z"
freshness: fresh
state: active
owner: system
read_hint: "运维人员必读，避免夜间操作事故"
```
