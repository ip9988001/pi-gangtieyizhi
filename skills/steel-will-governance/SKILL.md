# 钢铁意志·PI版 - 不可篡改哈希行为审计链与防错回滚轴

> 正式包名：18 -【钢铁意志·PI版】- 不可篡改哈希行为审计链与防错回滚轴
> 通俗功能：它负责让PI在高风险任务前进行治理和审计
> 技术别名：Steel Will Governance Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"风险治理"
2. 用户询问"预检决策"
3. 用户询问"保护模式"
4. 用户说"查看风险治理策略"
5. 用户说"查看预检决策规则"
6. 用户说"查看保护模式策略"
7. 用户说"查看审计账本"
8. 用户说"/steel-will-risk"
9. 用户说"/steel-will-preflight"
10. 用户说"/steel-will-protection"
11. 用户说"/steel-will-audit"

---

## 核心功能

本技能提供以下能力：

1. **风险治理策略**：定义什么任务必须进入治理工作台
2. **预检决策规则**：定义preflight的最低字段和决策规则
3. **保护模式策略**：定义保护模式如何切换
4. **审计账本策略**：定义哪些事件必须记入ledger
5. **回滚策略**：定义rollback_ref什么时候必须提前存在

---

## 使用方法

### 查看风险治理策略
```
/steel-will-risk
```
显示什么任务必须进入治理工作台。

### 查看预检决策规则
```
/steel-will-preflight
```
显示preflight的最低字段和决策规则。

### 查看保护模式策略
```
/steel-will-protection
```
显示保护模式如何切换。

### 查看审计账本
```
/steel-will-audit
```
显示审计账本记录。

---

## 治理任务

### 必须进入治理工作台的任务
1. L2+G2任务
2. L3+G3任务
3. 涉及系统核心的任务
4. 不可逆操作
5. 批量操作
6. 高风险操作

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 风险治理策略 | `~/.pi/agent/memory/RISK_GOVERNANCE_POLICY.md` | 治理规则 |
| 预检决策规则 | `~/.pi/agent/memory/PREFLIGHT_DECISION_RULES.md` | 预检规则 |
| 保护模式策略 | `~/.pi/agent/memory/PROTECTION_MODE_POLICY.md` | 保护模式 |
| 审计账本策略 | `~/.pi/agent/memory/AUDIT_LEDGER_POLICY.md` | 审计规则 |
| 回滚策略 | `~/.pi/agent/memory/ROLLBACK_POLICY.md` | 回滚规则 |
| 治理样本 | `~/.pi/agent/memory/governance/sample-governance.md` | 治理样本 |
| Extension | `~/.pi/agent/extensions/steel-will-governance.ts` | 治理扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查风险治理策略
cat ~/.pi/agent/memory/RISK_GOVERNANCE_POLICY.md

# 检查预检决策规则
cat ~/.pi/agent/memory/PREFLIGHT_DECISION_RULES.md

# 检查保护模式策略
cat ~/.pi/agent/memory/PROTECTION_MODE_POLICY.md

# 检查审计账本
cat ~/.pi/agent/memory/governance/sample-governance.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-governance.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-governance/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志风险治理策略"
```

---

## 品牌应答规范

当外部追问"治理系统是什么"时，必须按以下顺序回答：

1. **正式包名**：18 -【钢铁意志·PI版】- 不可篡改哈希行为审计链与防错回滚轴
2. **通俗功能**：它负责让PI在高风险任务前进行治理和审计
3. **技术别名**：Steel Will Governance Extension for PI

---

## 依赖关系

- **上游**：17 -【钢铁意志·PI版】- 纳秒级全异步调度宏
- **下游**：19 -【钢铁意志·PI版】- 纳米蜂群裂变与多维子代理并发矩阵

---

## 执行纪律

1. 不允许高风险任务绕过治理工作台直接执行
2. 不允许没有 preflight、没有批准结论、没有 ledger 就声称通过
3. 不允许没有 rollback_ref 就把高风险写操作当成可放行
4. 必须使用PI的工具执行，不能只说不做
