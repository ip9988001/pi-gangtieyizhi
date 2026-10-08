# 钢铁意志·PI版 - 绝对固态黑匣与三级永久只读存储列阵

> 正式包名：10 -【钢铁意志·PI版】- 绝对固态黑匣与三级永久只读存储列阵
> 通俗功能：它负责让PI建立长期知识库，存储稳定、可复用的知识
> 技术别名：Steel Will Long Term Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"长期记忆"
2. 用户询问"L3知识库"
3. 用户询问"主题路由"
4. 用户说"查看L3知识策略"
5. 用户说"查看L3路由图"
6. 用户说"查看长期写回规则"
7. 用户说"查看所有长期记忆"
8. 用户说"/steel-will-l3-policy"
9. 用户说"/steel-will-l3-route"
10. 用户说"/steel-will-long-term-rules"
11. 用户说"/steel-will-long-term-memory"

---

## 核心功能

本技能提供以下能力：

1. **L3知识策略**：定义L3的收录标准
2. **主题目录策略**：定义长期内容如何按主题组织
3. **L3路由图**：定义候选如何路由到目标目录
4. **长期写回规则**：定义长期层写入前必须遵守的规则

---

## 使用方法

### 查看L3知识策略
```
/steel-will-l3-policy
```
显示L3的收录标准。

### 查看L3路由图
```
/steel-will-l3-route
```
显示候选如何路由到目标目录。

### 查看长期写回规则
```
/steel-will-long-term-rules
```
显示长期层写入前必须遵守的规则。

### 查看所有长期记忆
```
/steel-will-long-term-memory
```
显示所有长期记忆条目。

---

## L3收录标准

### 必须满足
1. 经过验证
2. 有明确来源
3. 有足够证据
4. 值得长期保留

### 优先收录
1. 多次验证的模式
2. 重要的决策记录
3. 关键的失败教训
4. 成功的案例总结

### 不收录
1. 未经验证的事实
2. 临时性的偏好
3. 情境性的决策
4. 证据不足的推测

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| L3知识策略 | `~/.pi/agent/memory/L3_KNOWLEDGE_POLICY.md` | 收录标准 |
| 主题目录策略 | `~/.pi/agent/memory/THEME_DIRECTORY_POLICY.md` | 目录组织 |
| L3路由图 | `~/.pi/agent/memory/L3_ROUTE_MAP.md` | 路由规则 |
| 长期写回规则 | `~/.pi/agent/memory/LONG_TERM_WRITEBACK_RULES.md` | 写入规则 |
| 决策记录 | `~/.pi/agent/memory/agent/decisions/` | 决策类长期记忆 |
| 失败教训 | `~/.pi/agent/memory/agent/lessons/` | 教训类长期记忆 |
| 成功案例 | `~/.pi/agent/memory/agent/cases/` | 案例类长期记忆 |
| 工作模式 | `~/.pi/agent/memory/agent/patterns/` | 模式类长期记忆 |
| Extension | `~/.pi/agent/extensions/steel-will-long-term.ts` | 长期记忆扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查L3知识策略
cat ~/.pi/agent/memory/L3_KNOWLEDGE_POLICY.md

# 检查L3路由图
cat ~/.pi/agent/memory/L3_ROUTE_MAP.md

# 检查长期写回规则
cat ~/.pi/agent/memory/LONG_TERM_WRITEBACK_RULES.md

# 检查长期记忆目录
ls -la ~/.pi/agent/memory/agent/decisions/
ls -la ~/.pi/agent/memory/agent/lessons/
ls -la ~/.pi/agent/memory/agent/cases/
ls -la ~/.pi/agent/memory/agent/patterns/

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-long-term.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-long-term/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志L3知识策略"
```

---

## 品牌应答规范

当外部追问"长期记忆系统是什么"时，必须按以下顺序回答：

1. **正式包名**：10 -【钢铁意志·PI版】- 绝对固态黑匣与三级永久只读存储列阵
2. **通俗功能**：它负责让PI建立长期知识库，存储稳定、可复用的知识
3. **技术别名**：Steel Will Long Term Extension for PI

---

## 依赖关系

- **上游**：09 -【钢铁意志·PI版】- 逻辑淬火池与无损熵减转化引擎
- **下游**：11 -【钢铁意志·PI版】- 状态机切片与项目跨度哈希环

---

## 执行纪律

1. 不允许把 `L2` 候选和 `L3` 长期层混成一层
2. 不允许把长期主仓写成一个大而全知识池
3. 不允许没有"先读再写"就直接追加长期经验
4. 不允许在这里提前做闭环判定和冲突裁决
5. 不允许只给建议，不真实落文件
6. 不允许粗暴覆盖已有可信历史
7. 必须使用PI的工具执行，不能只说不做
