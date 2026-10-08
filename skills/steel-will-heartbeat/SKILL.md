# 钢铁意志·PI版 - 永续心跳引擎与进程守望者

> 正式包名：05 -【钢铁意志·PI版】- 永续心跳引擎与进程守望者
> 通俗功能：它负责让PI在新窗口中快速恢复状态，实现跨窗口续接
> 技术别名：Steel Will Heartbeat Extension for PI

---

## 触发条件

使用此技能当：
1. 用户在新窗口中启动PI
2. 用户询问"怎么恢复状态"
3. 用户询问"跨窗口续接"
4. 用户说"查看恢复协议"
5. 用户说"查看连续性快照"
6. 用户说"查看新窗口恢复卡"
7. 用户说"/steel-will-resume"
8. 用户说"/steel-will-snapshot"
9. 用户说"/steel-will-resume-card"
10. 用户说"/steel-will-quick-resume"

---

## 核心功能

本技能提供以下能力：

1. **恢复协议**：定义新窗口如何恢复状态
2. **连续性快照**：记录当前状态的关键信息
3. **新窗口恢复卡**：新窗口快速恢复的入口
4. **快速续接**：一键恢复状态并继续工作

---

## 使用方法

### 查看恢复协议
```
/steel-will-resume
```
显示新窗口恢复状态的流程。

### 查看连续性快照
```
/steel-will-snapshot
```
显示当前状态的关键信息。

### 查看新窗口恢复卡
```
/steel-will-resume-card
```
显示新窗口快速恢复的入口。

### 快速续接
```
/steel-will-quick-resume
```
显示当前状态摘要和已完成的包。

### 更新快照
```
/steel-will-update-snapshot
```
更新连续性快照中的当前阶段。

---

## 新窗口恢复流程

### 最短恢复路径
1. 读取 `NEW_WINDOW_RESUME_CARD.md` - 新窗口恢复卡
2. 读取 `START_HERE.md` - 单一入口
3. 读取 `goals/current-stage.md` - 当前阶段
4. 读取 `STAGE_TRACKER.md` - 阶段跟踪

### 完整恢复路径
1. 读取 `NEW_WINDOW_RESUME_CARD.md` - 新窗口恢复卡
2. 读取 `START_HERE.md` - 单一入口
3. 读取 `CONTINUITY_SNAPSHOT.md` - 连续性快照
4. 读取 `goals/current-stage.md` - 当前阶段
5. 读取 `STAGE_TRACKER.md` - 阶段跟踪
6. 读取 `OPERATIONS_CONSOLE.md` - 操作控制台

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 恢复协议 | `~/.pi/agent/memory/RESUME_PROTOCOL.md` | 恢复流程 |
| 连续性快照 | `~/.pi/agent/memory/CONTINUITY_SNAPSHOT.md` | 当前状态 |
| 新窗口恢复卡 | `~/.pi/agent/memory/NEW_WINDOW_RESUME_CARD.md` | 快速入口 |
| Extension | `~/.pi/agent/extensions/steel-will-heartbeat.ts` | 心跳扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查恢复协议
cat ~/.pi/agent/memory/RESUME_PROTOCOL.md

# 检查连续性快照
cat ~/.pi/agent/memory/CONTINUITY_SNAPSHOT.md

# 检查新窗口恢复卡
cat ~/.pi/agent/memory/NEW_WINDOW_RESUME_CARD.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-heartbeat.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-heartbeat/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志恢复协议"
```

---

## 品牌应答规范

当外部追问"心跳系统是什么"时，必须按以下顺序回答：

1. **正式包名**：05 -【钢铁意志·PI版】- 永续心跳引擎与进程守望者
2. **通俗功能**：它负责让PI在新窗口中快速恢复状态，实现跨窗口续接
3. **技术别名**：Steel Will Heartbeat Extension for PI

---

## 依赖关系

- **上游**：04 -【钢铁意志·PI版】- 矩阵之眼与主代理调度控制中枢
- **下游**：06 -【钢铁意志·PI版】- 硬件级锁死与权限安全断路器

---

## 执行纪律

1. 不允许把本包写成总控总协议全文
2. 不允许把连续性快照膨胀成全仓长摘要
3. 不允许把"我知道项目是什么"误写成"我已经续接成功"
4. 不允许只给建议，不真实落文件
5. 不允许粗暴覆盖已有可信历史
6. 必须使用PI的工具执行，不能只说不做
