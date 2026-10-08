# 钢铁意志·PI版 - 状态机切片与项目跨度哈希环

> 正式包名：11 -【钢铁意志·PI版】- 状态机切片与项目跨度哈希环
> 通俗功能：它负责让PI提炼精华、判断闭环、晋升可复用流程
> 技术别名：Steel Will Reflection Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"反思系统"
2. 用户询问"精华提炼"
3. 用户询问"闭环判断"
4. 用户说"查看精华提炼协议"
5. 用户说"查看闭环判断规则"
6. 用户说"查看可复用流程晋升规则"
7. 用户说"查看深提炼记录"
8. 用户说"/steel-will-essence"
9. 用户说"/steel-will-closure"
10. 用户说"/steel-will-reusable"
11. 用户说"/steel-will-reflections"

---

## 核心功能

本技能提供以下能力：

1. **精华提炼协议**：定义Nightly Reflection要提取哪些精华字段
2. **闭环判断规则**：定义什么叫闭环成立，什么叫闭环未成立
3. **可复用流程晋升规则**：定义什么情况下经验已接近可复用流程
4. **提炼引擎继承策略**：定义提炼引擎如何继承PI的主驱动配置

---

## 使用方法

### 查看精华提炼协议
```
/steel-will-essence
```
显示Nightly Reflection要提取哪些精华字段。

### 查看闭环判断规则
```
/steel-will-closure
```
显示什么叫闭环成立，什么叫闭环未成立。

### 查看可复用流程晋升规则
```
/steel-will-reusable
```
显示什么情况下经验已接近可复用流程。

### 查看深提炼记录
```
/steel-will-reflections
```
显示所有深提炼记录。

---

## 精华字段

### Nightly Reflection 要提取的字段
1. 锚点（anchor_refs）：原始来源引用
2. 精华内容（essence）：提炼后的核心信息
3. 类型（type）：决策/教训/案例/模式
4. 域（domain）：user/agent
5. 状态（status）：partial/candidate/promotable
6. 关键词（keywords）：便于检索

---

## 闭环判断

### 闭环成立
1. 问题已解决
2. 目标已达成
3. 经验已提炼
4. 知识已沉淀
5. 可以复用

### 闭环未成立
1. 问题未解决
2. 目标未达成
3. 经验未提炼
4. 知识未沉淀
5. 无法复用

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 精华提炼协议 | `~/.pi/agent/memory/ESSENCE_REFINEMENT_PROTOCOL.md` | 精华字段定义 |
| 闭环判断规则 | `~/.pi/agent/memory/CLOSURE_JUDGMENT_RULES.md` | 闭环判断规则 |
| 可复用流程晋升规则 | `~/.pi/agent/memory/REUSABLE_FLOW_PROMOTION_RULES.md` | 晋升规则 |
| 提炼引擎继承策略 | `~/.pi/agent/memory/REFINEMENT_ENGINE_INHERITANCE_POLICY.md` | 继承策略 |
| 深提炼记录 | `~/.pi/agent/memory/reflections/` | 提炼记录目录 |
| Extension | `~/.pi/agent/extensions/steel-will-reflection.ts` | 反思扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查精华提炼协议
cat ~/.pi/agent/memory/ESSENCE_REFINEMENT_PROTOCOL.md

# 检查闭环判断规则
cat ~/.pi/agent/memory/CLOSURE_JUDGMENT_RULES.md

# 检查可复用流程晋升规则
cat ~/.pi/agent/memory/REUSABLE_FLOW_PROMOTION_RULES.md

# 检查深提炼记录
ls -la ~/.pi/agent/memory/reflections/

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-reflection.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-reflection/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志精华提炼协议"
```

---

## 品牌应答规范

当外部追问"闭环系统是什么"时，必须按以下顺序回答：

1. **正式包名**：11 -【钢铁意志·PI版】- 状态机切片与项目跨度哈希环
2. **通俗功能**：它负责让PI提炼精华、判断闭环、晋升可复用流程
3. **技术别名**：Steel Will Reflection Extension for PI

---

## 依赖关系

- **上游**：10 -【钢铁意志·PI版】- 绝对固态黑匣与三级永久只读存储列阵
- **下游**：12 -【钢铁意志·PI版】- 致命反模式与失败经验隔离沙箱

---

## 执行纪律

1. 不允许把 Nightly Reflection 写成长篇散文，回避结构化判断
2. 不允许把"提炼过了"误报成"已经闭环"
3. 不允许把失败经验手册、冲突裁决和治理审计提前塞回本包
4. 不允许让本地工具替代主模型做保留价值、闭环价值和复用价值判断
5. 不允许为提炼引擎另起一套 provider / auth / endpoint / model
6. 不允许没有 anchor_refs 就生成长期判断
7. 必须使用PI的工具执行，不能只说不做
