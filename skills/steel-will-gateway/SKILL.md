# 钢铁意志·PI版 - 绝对防火墙与神经网关鉴权层

> 正式包名：02 -【钢铁意志·PI版】- 绝对防火墙与神经网关鉴权层
> 通俗功能：它负责让PI知道从哪进来、先读什么、最短怎么接手
> 技术别名：Steel Will Gateway Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"从哪里开始"
2. 用户询问"怎么接手"
3. 用户询问"入口是什么"
4. 用户说"查看入口"
5. 用户说"查看接手链"
6. 用户说"/steel-will-entry"
7. 用户说"/steel-will-handoff"
8. 用户说"/steel-will-nav"
9. 用户在新窗口中启动PI

---

## 核心功能

本技能提供以下能力：

1. **单一入口**：固定从START_HERE.md开始
2. **接手链**：最短路径了解系统状态
3. **新窗口交接**：跨窗口快速恢复上下文
4. **快速导航**：一键查看所有关键文件

---

## 使用方法

### 查看入口指引
```
/steel-will-entry
```
显示单一入口文件内容。

### 查看接手链
```
/steel-will-handoff
```
显示最短接手链。

### 查看交接提示词
```
/steel-will-handoff-prompt
```
显示新窗口交接提示词。

### 快速导航
```
/steel-will-nav
```
显示所有关键文件状态和快速命令。

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 单一入口 | `~/.pi/agent/memory/START_HERE.md` | 先读这个 |
| 接手链 | `~/.pi/agent/memory/HANDOFF_CHAIN.md` | 最短路径 |
| 交接提示词 | `~/.pi/agent/memory/NEW_WINDOW_HANDOFF_PROMPT.md` | 新窗口用 |
| Extension | `~/.pi/agent/extensions/steel-will-gateway.ts` | 网关扩展代码 |

---

## 最短接手链

### 第一次接手
1. `START_HERE.md` - 单一入口（先读这个）
2. `goals/master-goal.md` - 母目标（了解要成为什么）
3. `goals/completion-definition.md` - 完成态定义（了解什么算完成）
4. `goals/current-stage.md` - 当前真实阶段（了解现在走到哪）

### 继续施工
1. `START_HERE.md` - 确认当前状态
2. `goals/current-stage.md` - 确认当前阶段
3. `stages/` - 查看已完成的包
4. 按序号继续下一个包

---

## 部署验证

部署后验证：

```bash
# 检查入口文件
cat ~/.pi/agent/memory/START_HERE.md

# 检查接手链
cat ~/.pi/agent/memory/HANDOFF_CHAIN.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-gateway.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-gateway/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志入口"
```

---

## 品牌应答规范

当外部追问"网关系统是什么"时，必须按以下顺序回答：

1. **正式包名**：02 -【钢铁意志·PI版】- 绝对防火墙与神经网关鉴权层
2. **通俗功能**：它负责让PI知道从哪进来、先读什么、最短怎么接手
3. **技术别名**：Steel Will Gateway Extension for PI

---

## 依赖关系

- **上游**：01 -【钢铁意志·PI版】- 自举引导序列与依赖注入基座
- **下游**：03 -【钢铁意志·PI版】- 底层指令覆写与全局约束集

---

## 执行纪律

1. 不允许保留多个互相竞争的主入口
2. 不允许把阶段判断正文重写进本包
3. 不允许把默认运行面正文重写进本包
4. 不允许只给建议，不真实落文件
5. 不允许粗暴覆盖已有可信历史
6. 必须使用PI的工具执行，不能只说不做
