# Recall信号账本规范

## 账本定义

Recall信号账本是记录recall命中历史的独立轻量账本，用于回流训练记忆层。

## 账本位置

```
~/.pi/agent/memory/agent/system/RECALL_SIGNAL_LEDGER.jsonl
```

## 账本格式

### 格式: JSONL (每行一个JSON对象)
```json
{"at":"2026-06-03T10:30:00Z","target":"~/.pi/agent/memory/lessons/night-restart-lesson.md","recall_source":"S2","hit_context":"查询重启铁律","retrieval_layer":"semantic"}
```

## 最小字段

### 1. at (时间戳)
- **类型**: string (ISO 8601)
- **说明**: recall命中时间
- **示例**: "2026-06-03T10:30:00Z"

### 2. target (目标)
- **类型**: string
- **说明**: 命中的目标条目路径
- **示例**: "~/.pi/agent/memory/lessons/night-restart-lesson.md"

### 3. recall_source (recall来源)
- **类型**: string
- **说明**: recall的来源层级
- **示例**: "S1"、"S2"、"S3"

### 4. hit_context (命中上下文)
- **类型**: string
- **说明**: 命中时的查询上下文
- **示例**: "查询重启铁律"

### 5. retrieval_layer (检索层级)
- **类型**: string
- **说明**: 检索的层级
- **示例**: "lexical"、"semantic"、"hybrid"

## 账本追加规则

### 追加时机
- 每次recall命中后追加
- 不修改已有记录

### 追加方式
- 使用appendFileSync追加到文件末尾
- 每行一个JSON对象
- 不删除或修改已有记录

## 账本用途

### 1. 训练记忆层
- 分析哪些条目经常被命中
- 识别高频访问条目
- 优化记忆组织

### 2. 优化检索
- 分析哪些查询经常命中
- 识别检索模式
- 优化检索策略

### 3. 热度回流
- 基于命中历史更新热度
- 识别热门条目
- 优化排序

## 账本维护

### 账本清理
- **条件**: 账本过大（超过10000条）
- **操作**: 归档旧记录，保留最近记录
- **频率**: 定期检查

### 账本备份
- **条件**: 定期备份
- **操作**: 备份账本文件
- **频率**: 每周或每月

## 注意事项

1. **账本是追加式**: 只追加，不修改或删除
2. **账本是轻量级**: 只记录最小必要字段
3. **账本是独立的**: 不与条目正文混合
