# 钢铁意志·PI版 - 格式化风暴与无用字节抹除协议

> 正式包名：13 -【钢铁意志·PI版】- 格式化风暴与无用字节抹除协议
> 通俗功能：它负责让PI处理冲突、替代、过时和未回写问题
> 技术别名：Steel Will Adjudicator Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"冲突裁决"
2. 用户询问"替代策略"
3. 用户询问"过时检测"
4. 用户说"查看冲突裁决规则"
5. 用户说"查看替代策略"
6. 用户说"查看过时检测规则"
7. 用户说"查看裁决账本"
8. 用户说"/steel-will-conflict"
9. 用户说"/steel-will-supersession"
10. 用户说"/steel-will-stale"
11. 用户说"/steel-will-ledger"

---

## 核心功能

本技能提供以下能力：

1. **冲突裁决规则**：定义如何处理内容冲突
2. **替代策略**：定义如何处理内容替代
3. **过时检测规则**：定义如何检测和处理过时内容
4. **未回写规则**：定义如何处理未回写的内容
5. **裁决账本规则**：定义如何记录裁决历史

---

## 使用方法

### 查看冲突裁决规则
```
/steel-will-conflict
```
显示如何处理内容冲突。

### 查看替代策略
```
/steel-will-supersession
```
显示如何处理内容替代。

### 查看过时检测规则
```
/steel-will-stale
```
显示如何检测和处理过时内容。

### 查看裁决账本
```
/steel-will-ledger
```
显示裁决历史记录。

---

## 冲突处理

### 冲突定义
当两个或多个内容对同一主题有不同描述时，就产生了冲突。

### 处理流程
1. 记录冲突
2. 收集证据
3. 判断是否可以裁决
4. 执行裁决或挂起等待
5. 更新状态

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 冲突裁决规则 | `~/.pi/agent/memory/CONFLICT_ADJUDICATION_RULES.md` | 冲突处理规则 |
| 替代策略 | `~/.pi/agent/memory/SUPERSESSION_POLICY.md` | 替代处理规则 |
| 过时检测规则 | `~/.pi/agent/memory/STALE_DETECTION_AND_DISPOSITION_RULES.md` | 过时处理规则 |
| 未回写规则 | `~/.pi/agent/memory/UNREFLECTED_WRITEBACK_RULES.md` | 未回写处理规则 |
| 裁决账本规则 | `~/.pi/agent/memory/ADJUDICATION_LEDGER_RULES.md` | 裁决记录规则 |
| 裁决账本 | `~/.pi/agent/memory/adjudication/` | 裁决历史目录 |
| Extension | `~/.pi/agent/extensions/steel-will-adjudicator.ts` | 裁决扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查冲突裁决规则
cat ~/.pi/agent/memory/CONFLICT_ADJUDICATION_RULES.md

# 检查替代策略
cat ~/.pi/agent/memory/SUPERSESSION_POLICY.md

# 检查过时检测规则
cat ~/.pi/agent/memory/STALE_DETECTION_AND_DISPOSITION_RULES.md

# 检查裁决账本
cat ~/.pi/agent/memory/adjudication/sample-adjudication.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-adjudicator.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-adjudicator/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志冲突裁决规则"
```

---

## 品牌应答规范

当外部追问"熵减清理系统是什么"时，必须按以下顺序回答：

1. **正式包名**：13 -【钢铁意志·PI版】- 格式化风暴与无用字节抹除协议
2. **通俗功能**：它负责让PI处理冲突、替代、过时和未回写问题
3. **技术别名**：Steel Will Adjudicator Extension for PI

---

## 依赖关系

- **上游**：12 -【钢铁意志·PI版】- 致命反模式与失败经验隔离沙箱
- **下游**：14 -【钢铁意志·PI版】- 全息倒排树与高维特征指针

---

## 执行纪律

1. 不允许让本地工具替代主模型做最终冲突裁决
2. 不允许因为有新版本就直接删除旧版本
3. 不允许因为长期未验证就跳过锚点链直接宣布废弃
4. 不允许只改正文不留裁决记录
5. 必须使用PI的工具执行，不能只说不做
