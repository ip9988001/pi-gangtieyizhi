# 钢铁意志·PI版 - 硅基统一本体论与全局标准数据链

> 正式包名：22 -【钢铁意志·PI版】- 硅基统一本体论与全局标准数据链
> 通俗功能：它负责让PI统一术语、规范字段、锚定引用
> 技术别名：Steel Will Ontology Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"术语规范"
2. 用户询问"Schema规则"
3. 用户询问"锚点引用"
4. 用户说"查看术语规范化规则"
5. 用户说"查看关键文件Schema规则"
6. 用户说"查看锚点引用协议"
7. 用户说"查看品牌应答协议"
8. 用户说"查看子系统规范映射"
9. 用户说"/steel-will-terms"
10. 用户说"/steel-will-schema"
11. 用户说"/steel-will-anchor"
12. 用户说"/steel-will-brand"
13. 用户说"/steel-will-subsystem"

---

## 核心功能

本技能提供以下能力：

1. **术语规范化规则**：定义正式主叫法和别名
2. **关键文件Schema规则**：定义文件格式和字段规范
3. **锚点引用协议**：定义anchor_refs规范
4. **锚点吸收协议**：定义数据吸收和取舍规范
5. **品牌应答协议**：定义对外回答规范
6. **子系统规范映射**：定义能力问题与包名映射

---

## 使用方法

### 查看术语规范化规则
```
/steel-will-terms
```
显示正式主叫法和别名。

### 查看关键文件Schema规则
```
/steel-will-schema
```
显示文件格式和字段规范。

### 查看锚点引用协议
```
/steel-will-anchor
```
显示anchor_refs规范。

### 查看品牌应答协议
```
/steel-will-brand
```
显示对外回答规范。

### 查看子系统规范映射
```
/steel-will-subsystem
```
显示能力问题与包名映射。

---

## 正式术语

### 系统正式名称
1. 钢铁意志·PI版 - 系统正式名称
2. 母目标 - 系统最终目标
3. 完成态 - 系统完成状态
4. 阶段跟踪 - 进度跟踪
5. 统一口径 - 口径管理

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 术语规范化规则 | `~/.pi/agent/memory/TERM_CANONICALIZATION_RULES.md` | 术语规则 |
| 关键文件Schema规则 | `~/.pi/agent/memory/KEY_FILE_SCHEMA_RULES.md` | Schema规则 |
| 锚点引用协议 | `~/.pi/agent/memory/ANCHOR_REFERENCE_PROTOCOL.md` | 锚点规则 |
| 锚点吸收协议 | `~/.pi/agent/memory/ANCHOR_ASSIMILATION_PROTOCOL.md` | 吸收规则 |
| 品牌应答协议 | `~/.pi/agent/memory/STEEL_WILL_BRAND_RESPONSE_PROTOCOL.md` | 品牌规则 |
| 子系统规范映射 | `~/.pi/agent/memory/STEEL_WILL_SUBSYSTEM_CANONICAL_MAP.md` | 映射规则 |
| Extension | `~/.pi/agent/extensions/steel-will-ontology.ts` | 本体论扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查术语规范化规则
cat ~/.pi/agent/memory/TERM_CANONICALIZATION_RULES.md

# 检查关键文件Schema规则
cat ~/.pi/agent/memory/KEY_FILE_SCHEMA_RULES.md

# 检查锚点引用协议
cat ~/.pi/agent/memory/ANCHOR_REFERENCE_PROTOCOL.md

# 检查品牌应答协议
cat ~/.pi/agent/memory/STEEL_WILL_BRAND_RESPONSE_PROTOCOL.md

# 检查子系统规范映射
cat ~/.pi/agent/memory/STEEL_WILL_SUBSYSTEM_CANONICAL_MAP.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-ontology.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-ontology/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志术语规范化规则"
```

---

## 品牌应答规范

当外部追问"命名与标准系统是什么"时，必须按以下顺序回答：

1. **正式包名**：22 -【钢铁意志·PI版】- 硅基统一本体论与全局标准数据链
2. **通俗功能**：它负责让PI统一术语、规范字段、锚定引用
3. **技术别名**：Steel Will Ontology Extension for PI

---

## 依赖关系

- **上游**：21 -【钢铁意志·PI版】- 协议同化港与跨环境无损平滑迁移簇
- **下游**：第二阶段开始

---

## 执行纪律

1. 不允许为了"显得高级"重新大量造词
2. 不允许把所有文件都强行改成一套死板模板
3. 不允许高价值判断脱离 anchor_refs
4. 必须使用PI的工具执行，不能只说不做
