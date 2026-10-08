# 钢铁意志·PI版 - 包25：自动化克隆印记与任务模式图灵闭环

## 正式包名
25 -【钢铁意志·PI版】- 自动化克隆印记与任务模式图灵闭环

## 通俗功能
记忆-检索闭环、使用信号回流、热度回流

## 技术别名
Steel Will Clone Imprint & Task Pattern Turing Loop

## 触发条件
当需要：
- 记录recall命中信号
- 更新条目访问统计
- 检查条目是否符合recall契约

## 已注册工具

### 1. record_recall_signal
记录recall命中信号到事件账本。

**参数**：
- `target`: 目标条目路径
- `recall_source`: recall来源（S1/S2/S3）
- `hit_context`: 命中上下文
- `retrieval_layer`: 检索层级

**账本位置**: `~/.pi/agent/memory/agent/system/RECALL_SIGNAL_LEDGER.jsonl`

### 2. update_access_stats
更新条目的访问统计。

**更新字段**：
- `last_accessed`: 最后访问时间
- `access_count`: 访问次数（递增）

### 3. check_recall_contract
检查条目是否符合记忆-检索字段契约。

**必要字段**：
- keywords: 关键词数组
- aliases: 别名数组
- summary: 摘要
- state: 状态
- read_hint: 读取提示
- anchor_refs: 锚点引用数组

## 已注册命令

### /clone-imprint-status
查看克隆印记模块状态

## 记忆-检索字段契约

### 条目层必要字段
条目在写入时，必须包含以下字段供recall使用：

| 字段 | 类型 | 说明 |
|------|------|------|
| keywords | string[] | 关键词，用于检索 |
| aliases | string[] | 别名，用于中文同义词匹配 |
| summary | string | 摘要，用于快速预览 |
| state | string | 状态，用于过滤 |
| read_hint | string | 读取提示，用于引导 |
| anchor_refs | string[] | 锚点引用，用于溯源 |

### 条目层可选增强字段
| 字段 | 类型 | 说明 |
|------|------|------|
| last_accessed | string | 最后访问时间 |
| access_count | number | 访问次数 |
| confidence | number | 置信度 |
| freshness | string | 新鲜度 |

## 命中回写规则

### 最小回写字段
recall命中后，最小回写以下字段到条目层：
- `last_accessed`: 更新为当前时间
- `access_count`: 递增1

### 不应回写到条目正文的信号
- 命中历史 → 进入事件账本
- 检索上下文 → 进入事件账本
- 检索层级 → 进入事件账本

## 热度回流规则

### 升温信号
- 条目被recall命中 → 升温
- 条目被成功使用 → 升温
- 条目被验证正确 → 升温

### 不升温信号
- 条目只是被读取 → 不升温
- 条目被标记过时 → 不升温

## 使用场景

1. **recall命中后**：调用record_recall_signal记录信号
2. **条目被使用后**：调用update_access_stats更新统计
3. **写入新条目前**：调用check_recall_contract检查契约
