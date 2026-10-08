# 钢铁意志·PI版 - 神经反射弧与语义检索技能

> 正式包名：15 -【钢铁意志·PI版】- 神经反射弧与执行前预加载总线
> 通俗功能：它负责让PI通过语义检索主动"回忆"历史记忆，避免幻觉
> 技术别名：Steel Will Semantic Retrieval Skill

---

## 🔴 记忆调用铁律

**【绝对纪律】遇到不确定的历史设定、曾踩过的坑或项目背景时，必须优先调用 recall_memory 技能，严禁凭空捏造或产生幻觉。**

---

## 触发条件

**必须使用此技能当：**
1. 你不确定某个历史设定或配置
2. 你需要查找曾踩过的坑或失败经验
3. 你需要回顾过往项目的上下文
4. 你需要查找某个决策的原因或背景
5. 你对某个规则或协议的细节不确定
6. 用户询问"回忆一下..."、"之前是怎么做的..."、"有没有类似的经验..."

**禁止行为：**
- ❌ 凭空编造历史记忆
- ❌ 假装记得不确定的内容
- ❌ 在没有调用 recall_memory 的情况下回答历史问题

---

## 核心功能

本技能提供以下能力：

1. **语义检索**：通过自然语言查询，找到语义最相似的历史记忆
2. **记忆回忆**：主动调用向量数据库，检索相关历史设定、经验、决策
3. **幻觉预防**：通过检索真实记忆，避免凭空捏造

---

## 工具定义：recall_memory

### 工具名称
```
recall_memory
```

### 工具描述
当你需要回忆历史设定、排查曾踩过的坑、或者查找过往项目的上下文时，使用此工具进行语义搜索。

### 入参

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | string | ✅ | 描述你需要寻找的内容，支持自然语言 |

### 查询示例

```
query: "防御矩阵密钥"
query: "微服务重启教训"
query: "钢铁意志系统架构"
query: "L3记忆写入规则"
query: "向量数据库配置"
```

### 出参格式

工具返回 Markdown 格式的字符串，示例：

```markdown
找到 3 条相关历史记忆：

**[1] 相似度: 0.85 | 来源: L3 (agent/lessons/)**
文件路径: C:\Users\35881\.pi\agent\memory\agent\lessons\microservice-lesson.md
内容: 微服务重启时需要注意...

---

**[2] 相似度: 0.78 | 来源: L1 (l1/)**
文件路径: C:\Users\35881\.pi\agent\memory\l1\2026-06-02.md
内容: 今天遇到了一个问题...

---

**[3] 相似度: 0.72 | 来源: L3 (agent/decisions/)**
文件路径: C:\Users\35881\.pi\agent\memory\agent\decisions\architecture-decision.md
内容: 决定采用微服务架构的原因是...
```

---

## 使用方法

### 方式1：PI工具调用（推荐）

在 Reasoning Loop 中，当遇到不确定的历史问题时，直接调用 recall_memory 工具：

```typescript
// 示例：查找防御矩阵密钥
const result = await pi.tools.recall_memory({
  query: "防御矩阵密钥"
});
```

### 方式2：手动命令

```
/steel-will-recall "防御矩阵密钥"
```

---

## 执行链路

```
用户提问/Agent思考
  ↓
判断是否需要回忆历史？
  ├─ 否 → 继续正常流程
  └─ 是 → 调用 recall_memory(query)
    ↓
semanticRetrievalService.searchMemory(query, 3)
  ↓
格式化为 Markdown 字符串
  ↓
返回结果供 Agent 使用
```

---

## 检索策略

### S1 → S2 → S3 降级流程

1. **S1 导航检索**：先尝试精确路径匹配
2. **S2 词法检索**：如果S1未命中，尝试关键词匹配
3. **S3 语义检索**：如果S2未命中，使用 recall_memory 进行语义搜索

### 何时使用 recall_memory

| 场景 | 是否使用 |
|------|----------|
| 精确查找已知路径的文件 | ❌ 使用 read 工具 |
| 搜索包含特定关键词的内容 | ❌ 使用 grep 工具 |
| 不确定历史设定或配置 | ✅ 使用 recall_memory |
| 查找曾踩过的坑或失败经验 | ✅ 使用 recall_memory |
| 回顾过往项目的上下文 | ✅ 使用 recall_memory |
| 查找决策的原因或背景 | ✅ 使用 recall_memory |

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 语义检索策略 | `~/.pi/agent/memory/SEMANTIC_RETRIEVAL_POLICY.md` | S3定位 |
| 统一口径 | `~/.pi/agent/memory/UNIFIED_WORDING.md` | 记忆调用铁律 |
| Service | `~/.pi/agent/services/steel-will-semantic-retrieval.ts` | 核心引擎代码 |
| Skill | `~/.pi/agent/skills/steel-will-semantic-retrieval/SKILL.md` | 本文件 |
| 向量数据库 | `~/.pi/agent/memory/system/vector_db/` | 向量索引目录 |

---

## 部署验证

部署后验证：

```bash
# 检查Extension
ls -la ~/.pi/agent/services/steel-will-semantic-retrieval.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-semantic-retrieval/SKILL.md

# 检查向量数据库目录
ls -la ~/.pi/agent/memory/system/vector_db/

# 检查统一口径
cat ~/.pi/agent/memory/UNIFIED_WORDING.md | grep "记忆调用铁律"

# 测试PI启动
pi --verbose -p "回忆一下防御矩阵密钥"
```

---

## 品牌应答规范

当外部追问"语义检索技能是什么"时，必须按以下顺序回答：

1. **正式包名**：15 -【钢铁意志·PI版】- 神经反射弧与执行前预加载总线
2. **通俗功能**：它负责让PI通过语义检索主动"回忆"历史记忆，避免幻觉
3. **技术别名**：Steel Will Semantic Retrieval Skill
4. **核心工具**：recall_memory - 语义搜索历史记忆

---

## 依赖关系

- **上游**：14 -【钢铁意志·PI版】- 全息倒排树与高维特征指针
- **下游**：16 -【钢铁意志·PI版】- 战术外骨骼与动态经验热插拔模块
- **依赖**：@xenova/transformers（文本转向量）、vectra（本地向量数据库）

---

## 执行纪律

1. **【记忆调用铁律】** 遇到不确定的历史设定、曾踩过的坑或项目背景时，必须优先调用 recall_memory 技能，严禁凭空捏造或产生幻觉
2. 不允许在没有检索的情况下回答历史问题
3. 不允许把语义检索写成唯一主路，必须遵循 S1 → S2 → S3 降级流程
4. 不允许中文场景只信纯语义路径，词法检索仍是重要补充
5. 必须使用PI的工具执行，不能只说不做

---

## 更新记录

- 2026-06-03 04:30:00：初始创建，定义 recall_memory 工具
- 2026-06-03 04:30:00：增加【记忆调用铁律】绝对纪律
- 2026-06-03 04:30:00：完善 S1 → S2 → S3 降级流程
