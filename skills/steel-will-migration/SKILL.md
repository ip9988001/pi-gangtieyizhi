# 钢铁意志·PI版 - 协议同化港与跨环境无损平滑迁移簇

> 正式包名：21 -【钢铁意志·PI版】- 协议同化港与跨环境无损平滑迁移簇
> 通俗功能：它负责让PI在不同环境间无损迁移
> 技术别名：Steel Will Migration Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"迁移系统"
2. 用户询问"Bootstrap部署"
3. 用户询问"工作区验收"
4. 用户说"查看Bootstrap部署协议"
5. 用户说"查看真实工作区验收规则"
6. 用户说"查看迁移烟雾测试规则"
7. 用户说"查看Bootstrap样本"
8. 用户说"/steel-will-bootstrap"
9. 用户说"/steel-will-acceptance"
10. 用户说"/steel-will-smoke-test"
11. 用户说"/steel-will-bootstrap-sample"

---

## 核心功能

本技能提供以下能力：

1. **Bootstrap部署协议**：定义最小运行骨架清单、复制顺序、实例信息替换点
2. **真实工作区验收规则**：定义启动验收读取顺序和Pass/Partial/Fail
3. **迁移烟雾测试规则**：定义旧实例快照范围、新实例恢复顺序、smoke test项
4. **Bootstrap证据策略**：定义文件职责和证据保留规则

---

## 使用方法

### 查看Bootstrap部署协议
```
/steel-will-bootstrap
```
显示最小运行骨架清单、复制顺序、实例信息替换点。

### 查看真实工作区验收规则
```
/steel-will-acceptance
```
显示启动验收读取顺序和Pass/Partial/Fail。

### 查看迁移烟雾测试规则
```
/steel-will-smoke-test
```
显示旧实例快照范围、新实例恢复顺序、smoke test项。

### 查看Bootstrap样本
```
/steel-will-bootstrap-sample
```
显示Bootstrap样本文件列表。

---

## 运行骨架

### 最小运行骨架清单
1. AGENTS.md - 全局上下文
2. HEARTBEAT.md - 心跳配置
3. NOW.md - 当前状态
4. HOT_MEMORY.md - 热点记忆
5. WARM_MEMORY.md - 温点记忆
6. MEMORY.md - 记忆配置
7. memory/INDEX.md - 记忆索引
8. system/capability_profile.json - 能力配置
9. system/ledger.json - 审计账本
10. system/protection_status.json - 保护状态

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| Bootstrap部署协议 | `~/.pi/agent/memory/BOOTSTRAP_DEPLOYMENT_PROTOCOL.md` | 部署规则 |
| 真实工作区验收规则 | `~/.pi/agent/memory/REAL_WORKSPACE_ACCEPTANCE_RULES.md` | 验收规则 |
| 迁移烟雾测试规则 | `~/.pi/agent/memory/MIGRATION_SMOKE_TEST_RULES.md` | 测试规则 |
| Bootstrap证据策略 | `~/.pi/agent/memory/BOOTSTRAP_EVIDENCE_POLICY.md` | 证据规则 |
| Bootstrap样本 | `~/.pi/agent/memory/governance/real_workspace_bootstrap_001/` | 样本目录 |
| Extension | `~/.pi/agent/extensions/steel-will-migration.ts` | 迁移扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查Bootstrap部署协议
cat ~/.pi/agent/memory/BOOTSTRAP_DEPLOYMENT_PROTOCOL.md

# 检查真实工作区验收规则
cat ~/.pi/agent/memory/REAL_WORKSPACE_ACCEPTANCE_RULES.md

# 检查迁移烟雾测试规则
cat ~/.pi/agent/memory/MIGRATION_SMOKE_TEST_RULES.md

# 检查Bootstrap样本
ls -la ~/.pi/agent/memory/governance/real_workspace_bootstrap_001/

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-migration.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-migration/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志Bootstrap部署协议"
```

---

## 品牌应答规范

当外部追问"迁移系统是什么"时，必须按以下顺序回答：

1. **正式包名**：21 -【钢铁意志·PI版】- 协议同化港与跨环境无损平滑迁移簇
2. **通俗功能**：它负责让PI在不同环境间无损迁移
3. **技术别名**：Steel Will Migration Extension for PI

---

## 依赖关系

- **上游**：20 -【钢铁意志·PI版】- 碳基环境嗅探与第三方物理隔离舱
- **下游**：22 -【钢铁意志·PI版】- 硅基统一本体论与全局标准数据链

---

## 执行纪律

1. 不允许没有备份就进入正式接入
2. 不允许直接覆盖未知旧状态
3. 不允许把"复制成功"误报成"接入通过"
4. 必须使用PI的工具执行，不能只说不做
