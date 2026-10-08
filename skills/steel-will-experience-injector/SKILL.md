# 钢铁意志·PI版 - 战术外骨骼与动态经验热插拔模块

> 正式包名：16 -【钢铁意志·PI版】- 战术外骨骼与动态经验热插拔模块
> 通俗功能：它负责让PI在执行前注入相关经验，避免重复犯错
> 技术别名：Steel Will Experience Injector Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"经验注入"
2. 用户询问"Experience Bundle"
3. 用户询问"触发策略"
4. 用户说"查看Experience Bundle模式"
5. 用户说"查看触发策略"
6. 用户说"查看注入策略"
7. 用户说"查看所有Bundle"
8. 用户说"/steel-will-bundle"
9. 用户说"/steel-will-trigger"
10. 用户说"/steel-will-injection"
11. 用户说"/steel-will-bundles"

---

## 核心功能

本技能提供以下能力：

1. **Experience Bundle模式**：定义Bundle的最小字段
2. **触发策略**：定义哪些trigger会构造bundle
3. **注入策略**：定义bundle在哪里注入
4. **Bundle来源选择规则**：定义哪些锚点允许进入bundle
5. **注入限流规则**：定义条数上限、跳过条件和降级条件

---

## 使用方法

### 查看Experience Bundle模式
```
/steel-will-bundle
```
显示Bundle的最小字段。

### 查看触发策略
```
/steel-will-trigger
```
显示哪些trigger会构造bundle。

### 查看注入策略
```
/steel-will-injection
```
显示bundle在哪里注入。

### 查看所有Bundle
```
/steel-will-bundles
```
显示所有Bundle文件。

---

## Bundle字段

### 最小字段
1. bundle_id：Bundle唯一标识
2. task_type：任务类型
3. domain：领域（user/agent）
4. phase：阶段（planning/execution/review）
5. risks：风险列表
6. anti_patterns：反模式列表
7. lessons：教训列表
8. recommended_moves：建议动作列表
9. sources：来源引用列表
10. created_at：创建时间
11. status：状态（active/archived）

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| Experience Bundle模式 | `~/.pi/agent/memory/EXPERIENCE_BUNDLE_SCHEMA.md` | Bundle字段定义 |
| 触发策略 | `~/.pi/agent/memory/TRIGGER_POLICY.md` | 触发规则 |
| 注入策略 | `~/.pi/agent/memory/INJECTION_POLICY.md` | 注入规则 |
| Bundle来源选择规则 | `~/.pi/agent/memory/BUNDLE_SOURCE_SELECTION_RULES.md` | 来源规则 |
| 注入限流规则 | `~/.pi/agent/memory/INJECTION_RATE_LIMIT_RULES.md` | 限流规则 |
| Bundle目录 | `~/.pi/agent/memory/bundles/` | Bundle文件目录 |
| Extension | `~/.pi/agent/extensions/steel-will-experience-injector.ts` | 经验注入扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查Experience Bundle模式
cat ~/.pi/agent/memory/EXPERIENCE_BUNDLE_SCHEMA.md

# 检查触发策略
cat ~/.pi/agent/memory/TRIGGER_POLICY.md

# 检查注入策略
cat ~/.pi/agent/memory/INJECTION_POLICY.md

# 检查Bundle目录
ls -la ~/.pi/agent/memory/bundles/

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-experience-injector.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-experience-injector/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志Experience Bundle模式"
```

---

## 品牌应答规范

当外部追问"经验注入系统是什么"时，必须按以下顺序回答：

1. **正式包名**：16 -【钢铁意志·PI版】- 战术外骨骼与动态经验热插拔模块
2. **通俗功能**：它负责让PI在执行前注入相关经验，避免重复犯错
3. **技术别名**：Steel Will Experience Injector Extension for PI

---

## 依赖关系

- **上游**：15 -【钢铁意志·PI版】- 神经反射弧与执行前预加载总线
- **下游**：17 -【钢铁意志·PI版】- 纳秒级全异步调度宏

---

## 执行纪律

1. 不允许把 L1 原始记录、整篇原文、大段代码直接塞进 bundle
2. 不允许把 conflict / superseded / stale / unreflected / quarantined / deprecated 条目默认注入执行面
3. 不允许没有 sources 就做正式注入
4. 必须使用PI的工具执行，不能只说不做
