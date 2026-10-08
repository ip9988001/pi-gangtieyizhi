# 钢铁意志·PI版 - 纳秒级全异步调度宏

> 正式包名：17 -【钢铁意志·PI版】- 纳秒级全异步调度宏
> 通俗功能：它负责让PI按任务等级和风险级别调度执行
> 技术别名：Steel Will Scheduler V2 Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"任务分级"
2. 用户询问"节律调度"
3. 用户询问"Heartbeat节律"
4. 用户说"查看任务分级策略"
5. 用户说"查看节律调度协议"
6. 用户说"查看Heartbeat节律"
7. 用户说"查看反射GC节律"
8. 用户说"/steel-will-task-grading"
9. 用户说"/steel-will-rhythm"
10. 用户说"/steel-will-heartbeat-rhythm"
11. 用户说"/steel-will-reflection-rhythm"

---

## 核心功能

本技能提供以下能力：

1. **任务分级策略**：定义L0-L3的复杂度语义和G0-G3的风险语义
2. **节律调度协议**：定义启动节律、任务节律、高风险插队节律
3. **Heartbeat每日同步节律**：定义Heartbeat和Daily Log Sync的默认主频
4. **反射GC节律**：定义Nightly Reflection和Weekly GC的默认主频

---

## 使用方法

### 查看任务分级策略
```
/steel-will-task-grading
```
显示L0-L3的复杂度语义和G0-G3的风险语义。

### 查看节律调度协议
```
/steel-will-rhythm
```
显示启动节律、任务节律、高风险插队节律。

### 查看Heartbeat节律
```
/steel-will-heartbeat-rhythm
```
显示Heartbeat和Daily Log Sync的默认主频。

### 查看反射GC节律
```
/steel-will-reflection-rhythm
```
显示Nightly Reflection和Weekly GC的默认主频。

---

## 任务分级

### L0-L3 复杂度
- L0：简单任务
- L1：普通任务
- L2：复杂任务
- L3：超复杂任务

### G0-G3 风险
- G0：无风险
- G1：低风险
- G2：中风险
- G3：高风险

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 任务分级策略 | `~/.pi/agent/memory/TASK_GRADING_POLICY.md` | 任务分级规则 |
| 节律调度协议 | `~/.pi/agent/memory/RHYTHM_SCHEDULING_PROTOCOL.md` | 节律调度规则 |
| Heartbeat节律 | `~/.pi/agent/memory/HEARTBEAT_DAILY_SYNC_RHYTHM.md` | Heartbeat节律 |
| 反射GC节律 | `~/.pi/agent/memory/REFLECTION_GC_RHYTHM.md` | 反射GC节律 |
| Extension | `~/.pi/agent/extensions/steel-will-scheduler-v2.ts` | 调度V2扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查任务分级策略
cat ~/.pi/agent/memory/TASK_GRADING_POLICY.md

# 检查节律调度协议
cat ~/.pi/agent/memory/RHYTHM_SCHEDULING_PROTOCOL.md

# 检查Heartbeat节律
cat ~/.pi/agent/memory/HEARTBEAT_DAILY_SYNC_RHYTHM.md

# 检查反射GC节律
cat ~/.pi/agent/memory/REFLECTION_GC_RHYTHM.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-scheduler-v2.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-scheduler-v2/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志任务分级策略"
```

---

## 品牌应答规范

当外部追问"调度系统是什么"时，必须按以下顺序回答：

1. **正式包名**：17 -【钢铁意志·PI版】- 纳秒级全异步调度宏
2. **通俗功能**：它负责让PI按任务等级和风险级别调度执行
3. **技术别名**：Steel Will Scheduler V2 Extension for PI

---

## 依赖关系

- **上游**：16 -【钢铁意志·PI版】- 战术外骨骼与动态经验热插拔模块
- **下游**：18 -【钢铁意志·PI版】- 不可篡改哈希行为审计链与防错回滚轴

---

## 执行纪律

1. 不允许把 Heartbeat、Reflection、GC 的内容正文直接重写成调度文件
2. 不允许把所有任务都套成同一条工作流
3. 不允许让高风险动作和普通维护流程同级排队
4. 必须使用PI的工具执行，不能只说不做
