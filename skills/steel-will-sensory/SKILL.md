# 钢铁意志·PI版 - 碳基环境嗅探与第三方物理隔离舱

> 正式包名：20 -【钢铁意志·PI版】- 碳基环境嗅探与第三方物理隔离舱
> 通俗功能：它负责让PI感知运行环境，保护系统安全
> 技术别名：Steel Will Sensory Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"感知系统"
2. 用户询问"宿主预检"
3. 用户询问"宿主保护"
4. 用户说"查看运行时感知策略"
5. 用户说"查看宿主预检规则"
6. 用户说"查看宿主保护反应规则"
7. 用户说"查看感知样本"
8. 用户说"/steel-will-sensory"
9. 用户说"/steel-will-preflight"
10. 用户说"/steel-will-host-protection"
11. 用户说"/steel-will-sensory-sample"

---

## 核心功能

本技能提供以下能力：

1. **运行时感知策略**：定义什么时候启用感知输入
2. **宿主预检规则**：定义哪些任务必须前置宿主体征采样
3. **宿主保护反应规则**：定义normal / guarded / hibernation的最低语义
4. **休眠和恢复策略**：定义什么时候休眠，怎样恢复
5. **视觉证据链策略**：定义GUI / Web失败时怎样留下视觉证据链

---

## 使用方法

### 查看运行时感知策略
```
/steel-will-sensory
```
显示什么时候启用感知输入。

### 查看宿主预检规则
```
/steel-will-preflight
```
显示哪些任务必须前置宿主体征采样。

### 查看宿主保护反应规则
```
/steel-will-host-protection
```
显示normal / guarded / hibernation的最低语义。

### 查看感知样本
```
/steel-will-sensory-sample
```
显示感知样本。

---

## 感知触发

### 什么时候启用感知输入
1. 高风险任务执行前
2. 系统状态异常时
3. 用户主动请求时
4. 定时触发（可选）

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 运行时感知策略 | `~/.pi/agent/memory/RUNTIME_SENSORY_POLICY.md` | 感知规则 |
| 宿主预检规则 | `~/.pi/agent/memory/SOMATIC_PREFLIGHT_RULES.md` | 预检规则 |
| 宿主保护反应规则 | `~/.pi/agent/memory/HOST_PROTECTION_REACTION_RULES.md` | 保护规则 |
| 休眠和恢复策略 | `~/.pi/agent/memory/HIBERNATION_AND_RECOVERY_POLICY.md` | 休眠恢复 |
| 视觉证据链策略 | `~/.pi/agent/memory/VISUAL_EVIDENCE_CHAIN_POLICY.md` | 证据链 |
| 感知样本 | `~/.pi/agent/memory/sensory_cortex/sample-sensory.md` | 感知样本 |
| Extension | `~/.pi/agent/extensions/steel-will-sensory.ts` | 感知扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查运行时感知策略
cat ~/.pi/agent/memory/RUNTIME_SENSORY_POLICY.md

# 检查宿主预检规则
cat ~/.pi/agent/memory/SOMATIC_PREFLIGHT_RULES.md

# 检查宿主保护反应规则
cat ~/.pi/agent/memory/HOST_PROTECTION_REACTION_RULES.md

# 检查感知样本
cat ~/.pi/agent/memory/sensory_cortex/sample-sensory.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-sensory.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-sensory/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志运行时感知策略"
```

---

## 品牌应答规范

当外部追问"宿主安全系统是什么"时，必须按以下顺序回答：

1. **正式包名**：20 -【钢铁意志·PI版】- 碳基环境嗅探与第三方物理隔离舱
2. **通俗功能**：它负责让PI感知运行环境，保护系统安全
3. **技术别名**：Steel Will Sensory Extension for PI

---

## 依赖关系

- **上游**：19 -【钢铁意志·PI版】- 纳米蜂群裂变与多维子代理并发矩阵
- **下游**：21 -【钢铁意志·PI版】- 协议同化港与跨环境无损平滑迁移簇

---

## 执行纪律

1. 不允许把感知层写成默认全时开启
2. 不允许把截图结果直接当成长期真理
3. 不允许把宿主体征日志写成新的长期知识噪音
4. 必须使用PI的工具执行，不能只说不做
