# 钢铁意志·PI版 - 硬件级锁死与权限安全断路器

> 正式包名：06 -【钢铁意志·PI版】- 硬件级锁死与权限安全断路器
> 通俗功能：它负责让PI记住用户偏好、边界控制、审批规则
> 技术别名：Steel Will Security Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"权限设置"
2. 用户询问"边界规则"
3. 用户询问"审批流程"
4. 用户说"查看边界规则"
5. 用户说"查看审批规则"
6. 用户说"查看用户偏好"
7. 用户说"/steel-will-boundary"
8. 用户说"/steel-will-approval"
9. 用户说"/steel-will-preferences"
10. 执行高风险操作前

---

## 核心功能

本技能提供以下能力：

1. **偏好持久协议**：定义哪些内容有资格进入长期偏好层
2. **边界读取规则**：定义哪些动作执行前必须先读边界层
3. **用户偏好管理**：存储和管理用户偏好
4. **审批与边界**：定义审批规则与硬边界

---

## 使用方法

### 查看边界规则
```
/steel-will-boundary
```
显示哪些动作执行前必须先读边界层。

### 查看审批规则
```
/steel-will-approval
```
显示审批规则与硬边界。

### 查看用户偏好
```
/steel-will-preferences
```
显示所有用户偏好文件。

---

## 高风险操作清单

### 必须确认的操作
1. 删除文件或目录
2. 覆盖重要文件
3. 修改系统配置
4. 批量操作
5. 外发敏感内容
6. 访问敏感数据

### 风险等级定义
- **低风险**：读取文件、查看状态、搜索内容
- **中风险**：创建新文件、修改非关键文件、执行常规命令
- **高风险**：删除文件、覆盖重要文件、修改系统配置、批量操作

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 偏好持久协议 | `~/.pi/agent/memory/PREFERENCE_PERSISTENCE_PROTOCOL.md` | 偏好晋升规则 |
| 边界读取规则 | `~/.pi/agent/memory/BOUNDARY_READ_RULES.md` | 边界读取流程 |
| 沟通偏好 | `~/.pi/agent/memory/user/preferences/COMMUNICATION_PREFERENCES.md` | 沟通风格 |
| 工作偏好 | `~/.pi/agent/memory/user/preferences/WORK_PREFERENCES.md` | 工作流程 |
| 审批与边界 | `~/.pi/agent/memory/user/preferences/APPROVAL_AND_BOUNDARIES.md` | 审批规则 |
| Extension | `~/.pi/agent/extensions/steel-will-security.ts` | 安全扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查边界规则
cat ~/.pi/agent/memory/BOUNDARY_READ_RULES.md

# 检查审批规则
cat ~/.pi/agent/memory/user/preferences/APPROVAL_AND_BOUNDARIES.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-security.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-security/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志边界规则"
```

---

## 品牌应答规范

当外部追问"权限系统是什么"时，必须按以下顺序回答：

1. **正式包名**：06 -【钢铁意志·PI版】- 硬件级锁死与权限安全断路器
2. **通俗功能**：它负责让PI记住用户偏好、边界控制、审批规则
3. **技术别名**：Steel Will Security Extension for PI

---

## 依赖关系

- **上游**：05 -【钢铁意志·PI版】- 永续心跳引擎与进程守望者
- **下游**：07 -【钢铁意志·PI版】- 游离态突触与一级碎片缓存区

---

## 执行纪律

1. 不允许把一次临时聊天直接涨成长期偏好
2. 不允许把用户偏好和 Agent 经验混写
3. 不允许把审批规则只留在聊天上下文里
4. 不允许只给建议，不真实落文件
5. 不允许粗暴覆盖已有可信历史
6. 必须使用PI的工具执行，不能只说不做
