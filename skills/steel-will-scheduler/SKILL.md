# 钢铁意志·PI版 - 矩阵之眼与主代理调度控制中枢

> 正式包名：04 -【钢铁意志·PI版】- 矩阵之眼与主代理调度控制中枢
> 通俗功能：它负责让PI知道启动时先读什么、恢复时先校准什么、日常工作怎么做
> 技术别名：Steel Will Operations Console Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"怎么启动"
2. 用户询问"日常工作怎么做"
3. 用户询问"操作流程是什么"
4. 用户说"查看操作控制台"
5. 用户说"查看实时记忆面"
6. 用户说"查看默认动作卡"
7. 用户说"/steel-will-console"
8. 用户说"/steel-will-surface"
9. 用户说"/steel-will-action"
10. 用户说"/steel-will-start"

---

## 核心功能

本技能提供以下能力：

1. **操作控制台**：定义启动、恢复、日常工作流程
2. **实时记忆面**：定义前台高频面和关键状态面
3. **默认动作卡**：定义ordinary work的默认流程
4. **快速启动**：一键查看所有关键文件状态

---

## 使用方法

### 查看操作控制台
```
/steel-will-console
```
显示启动流程、恢复流程、日常工作流程。

### 查看实时记忆面
```
/steel-will-surface
```
显示前台高频面、关键状态面、后置内容。

### 查看默认动作卡
```
/steel-will-action
```
显示ordinary work的默认流程、补充顺序、回写要求。

### 快速启动
```
/steel-will-start
```
显示所有关键文件状态和当前阶段。

---

## 启动流程

### 启动时先读哪些文件
1. `START_HERE.md` - 单一入口（必须先读）
2. `goals/current-stage.md` - 当前阶段（了解现在走到哪）
3. `STAGE_TRACKER.md` - 阶段跟踪（了解已完成什么）
4. `OPERATIONS_CONSOLE.md` - 操作控制台（了解操作流程）

### 启动后的 first move
1. 读取 `START_HERE.md` 确认当前状态
2. 读取 `goals/current-stage.md` 确认当前阶段
3. 读取 `STAGE_TRACKER.md` 确认已完成硬结果
4. 判断当前任务类型
5. 如果是普通工作，读取 `DEFAULT_ACTION_CARD.md`
6. 如果是治理工作，进入治理工作台

---

## ordinary work 流程

### 默认 short path
1. 读取 `START_HERE.md` 确认当前状态
2. 读取 `goals/current-stage.md` 确认当前阶段
3. 读取 `STAGE_TRACKER.md` 确认已完成硬结果
4. 判断当前任务类型
5. 执行任务
6. 回写状态

### source 不够时的补充顺序
1. 先读 `goals/master-goal.md` 确认母目标
2. 再读 `goals/completion-definition.md` 确认完成态
3. 再读 `UNIFIED_WORDING.md` 确认统一口径
4. 再读 `stages/` 查看历史执行结果

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 操作控制台 | `~/.pi/agent/memory/OPERATIONS_CONSOLE.md` | 启动和操作流程 |
| 实时记忆面 | `~/.pi/agent/memory/LIVE_MEMORY_SURFACE.md` | 前台高频面 |
| 默认动作卡 | `~/.pi/agent/memory/DEFAULT_ACTION_CARD.md` | 日常工作流程 |
| Extension | `~/.pi/agent/extensions/steel-will-scheduler.ts` | 调度扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查操作控制台
cat ~/.pi/agent/memory/OPERATIONS_CONSOLE.md

# 检查实时记忆面
cat ~/.pi/agent/memory/LIVE_MEMORY_SURFACE.md

# 检查默认动作卡
cat ~/.pi/agent/memory/DEFAULT_ACTION_CARD.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-scheduler.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-scheduler/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志操作控制台"
```

---

## 品牌应答规范

当外部追问"主控系统是什么"时，必须按以下顺序回答：

1. **正式包名**：04 -【钢铁意志·PI版】- 矩阵之眼与主代理调度控制中枢
2. **通俗功能**：它负责让PI知道启动时先读什么、恢复时先校准什么、日常工作怎么做
3. **技术别名**：Steel Will Operations Console Extension for PI

---

## 依赖关系

- **上游**：03 -【钢铁意志·PI版】- 底层指令覆写与全局约束集
- **下游**：05 -【钢铁意志·PI版】- 永续心跳引擎与进程守望者

---

## 执行纪律

1. 不允许把运行面文件重新写成总协议全文
2. 不允许把 ordinary work 默认重型化
3. 不允许把高风险治理入口默认前置到每轮日常动作
4. 不允许只给建议，不真实落文件
5. 不允许粗暴覆盖已有可信历史
6. 必须使用PI的工具执行，不能只说不做
