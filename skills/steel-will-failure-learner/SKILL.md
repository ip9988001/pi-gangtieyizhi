# 钢铁意志·PI版 - 致命反模式与失败经验隔离沙箱

> 正式包名：12 -【钢铁意志·PI版】- 致命反模式与失败经验隔离沙箱
> 通俗功能：它负责让PI从失败中学习，形成反模式和避坑指南
> 技术别名：Steel Will Failure Learner Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"失败经验"
2. 用户询问"反模式"
3. 用户询问"避坑指南"
4. 用户说"查看失败学习协议"
5. 用户说"查看反模式规则"
6. 用户说"查看避坑指南"
7. 用户说"查看所有失败经验"
8. 用户说"/steel-will-failure"
9. 用户说"/steel-will-anti-pattern"
10. 用户说"/steel-will-pitfall"
11. 用户说"/steel-will-lessons"

---

## 核心功能

本技能提供以下能力：

1. **失败学习协议**：定义失败经验如何转成结构化知识
2. **反模式规则**：定义什么叫反模式，反模式的最低字段
3. **避坑指南策略**：定义避坑指南的格式和要求
4. **失败晋升规则**：定义失败经验什么时候晋升到哪个层次

---

## 使用方法

### 查看失败学习协议
```
/steel-will-failure
```
显示失败经验如何转成结构化知识。

### 查看反模式规则
```
/steel-will-anti-pattern
```
显示什么叫反模式，反模式的最低字段。

### 查看避坑指南
```
/steel-will-pitfall
```
显示避坑指南的格式和要求。

### 查看所有失败经验
```
/steel-will-lessons
```
显示所有失败经验条目。

---

## 失败经验结构

### 必须包含的字段
1. risk：风险描述
2. anti-pattern：反模式描述
3. lesson：教训总结
4. recommended_action：建议行动
5. anchor_refs：原始来源引用

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 失败学习协议 | `~/.pi/agent/memory/FAILURE_LEARNING_PROTOCOL.md` | 失败学习规则 |
| 反模式规则 | `~/.pi/agent/memory/ANTI_PATTERN_RULES.md` | 反模式定义 |
| 避坑指南策略 | `~/.pi/agent/memory/PITFALL_GUIDE_POLICY.md` | 避坑指南格式 |
| 失败晋升规则 | `~/.pi/agent/memory/FAILURE_PROMOTION_RULES.md` | 晋升规则 |
| 失败经验 | `~/.pi/agent/memory/agent/lessons/` | 失败经验目录 |
| Extension | `~/.pi/agent/extensions/steel-will-failure-learner.ts` | 失败学习扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查失败学习协议
cat ~/.pi/agent/memory/FAILURE_LEARNING_PROTOCOL.md

# 检查反模式规则
cat ~/.pi/agent/memory/ANTI_PATTERN_RULES.md

# 检查避坑指南策略
cat ~/.pi/agent/memory/PITFALL_GUIDE_POLICY.md

# 检查失败经验目录
ls -la ~/.pi/agent/memory/agent/lessons/

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-failure-learner.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-failure-learner/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志失败学习协议"
```

---

## 品牌应答规范

当外部追问"失败经验系统是什么"时，必须按以下顺序回答：

1. **正式包名**：12 -【钢铁意志·PI版】- 致命反模式与失败经验隔离沙箱
2. **通俗功能**：它负责让PI从失败中学习，形成反模式和避坑指南
3. **技术别名**：Steel Will Failure Learner Extension for PI

---

## 依赖关系

- **上游**：11 -【钢铁意志·PI版】- 状态机切片与项目跨度哈希环
- **下游**：13 -【钢铁意志·PI版】- 格式化风暴与无用字节抹除协议

---

## 执行纪律

1. 不允许把失败经验原样复制进长期层
2. 不允许只有 lesson 没有 risk、anti-pattern 或 recommended_action
3. 不允许没有 anchor_refs 就生成失败经验
4. 不允许一次偶发失败就直接宣布形成通用反模式
5. 不允许没有真实样本就宣称失败学习主链已经成立
6. 必须使用PI的工具执行，不能只说不做
