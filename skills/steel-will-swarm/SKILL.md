# 钢铁意志·PI版 - 纳米蜂群裂变与多维子代理并发矩阵

> 正式包名：19 -【钢铁意志·PI版】- 纳米蜂群裂变与多维子代理并发矩阵
> 通俗功能：它负责让PI通过多代理协作提升效率
> 技术别名：Steel Will Swarm Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"多代理协作"
2. 用户询问"蜂群派发"
3. 用户询问"子代理mandate"
4. 用户说"查看多代理协作策略"
5. 用户说"查看蜂群派发策略"
6. 用户说"查看子代理mandate模式"
7. 用户说"查看协作样本"
8. 用户说"/steel-will-collaboration"
9. 用户说"/steel-will-dispatch"
10. 用户说"/steel-will-mandate"
11. 用户说"/steel-will-swarm-sample"

---

## 核心功能

本技能提供以下能力：

1. **多代理协作策略**：定义什么时候值得裂变
2. **蜂群派发策略**：定义如何派发子代理
3. **子代理mandate模式**：定义mandate的最低字段
4. **子代理回传协议**：定义insight_return的最低字段
5. **蜂群模板治理**：定义模板的分工

---

## 使用方法

### 查看多代理协作策略
```
/steel-will-collaboration
```
显示什么时候值得裂变。

### 查看蜂群派发策略
```
/steel-will-dispatch
```
显示如何派发子代理。

### 查看子代理mandate模式
```
/steel-will-mandate
```
显示mandate的最低字段。

### 查看协作样本
```
/steel-will-swarm-sample
```
显示协作样本。

---

## 裂变条件

### 值得裂变
1. 任务可以并行执行
2. 任务需要不同专业能力
3. 任务时间紧迫
4. 任务风险可控

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 多代理协作策略 | `~/.pi/agent/memory/MULTI_AGENT_COLLABORATION_POLICY.md` | 协作规则 |
| 蜂群派发策略 | `~/.pi/agent/memory/SWARM_DISPATCH_POLICY.md` | 派发规则 |
| 子代理mandate模式 | `~/.pi/agent/memory/SUBAGENT_MANDATE_SCHEMA.md` | mandate规则 |
| 子代理回传协议 | `~/.pi/agent/memory/SUBAGENT_RETURN_PROTOCOL.md` | 回传规则 |
| 蜂群模板治理 | `~/.pi/agent/memory/SWARM_TEMPLATE_GOVERNANCE.md` | 模板规则 |
| 协作样本 | `~/.pi/agent/memory/swarm_matrix/sample-collaboration.md` | 协作样本 |
| Extension | `~/.pi/agent/extensions/steel-will-swarm.ts` | 蜂群扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查多代理协作策略
cat ~/.pi/agent/memory/MULTI_AGENT_COLLABORATION_POLICY.md

# 检查蜂群派发策略
cat ~/.pi/agent/memory/SWARM_DISPATCH_POLICY.md

# 检查子代理mandate模式
cat ~/.pi/agent/memory/SUBAGENT_MANDATE_SCHEMA.md

# 检查协作样本
cat ~/.pi/agent/memory/swarm_matrix/sample-collaboration.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-swarm.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-swarm/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志多代理协作策略"
```

---

## 品牌应答规范

当外部追问"多代理系统是什么"时，必须按以下顺序回答：

1. **正式包名**：19 -【钢铁意志·PI版】- 纳米蜂群裂变与多维子代理并发矩阵
2. **通俗功能**：它负责让PI通过多代理协作提升效率
3. **技术别名**：Steel Will Swarm Extension for PI

---

## 依赖关系

- **上游**：18 -【钢铁意志·PI版】- 不可篡改哈希行为审计链与防错回滚轴
- **下游**：20 -【钢铁意志·PI版】- 碳基环境嗅探与第三方物理隔离舱

---

## 执行纪律

1. 不允许子代理默认获得全盘写权限
2. 不允许子代理直接改写长期记忆、保护状态和资产注册表
3. 不允许没有 mandate、没有回传、没有节点名录就宣称支持蜂群
4. 必须使用PI的工具执行，不能只说不做
