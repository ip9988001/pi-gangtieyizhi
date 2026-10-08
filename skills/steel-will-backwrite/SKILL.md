# 钢铁意志·PI版 - 回写技能

> 正式包名：03 -【钢铁意志·PI版】- 底层指令覆写与全局约束集
> 通俗功能：它负责让PI知道当前做到哪了、当前能怎么说、每轮结束后必须回写什么
> 技术别名：Steel Will State Control Extension for PI

---

## 触发条件

使用此技能当：
1. 完成一个包的部署后
2. 会话即将结束时
3. 遇到阻塞需要记录时
4. 阶段发生变化时
5. 用户说"回写状态"
6. 用户说"/steel-will-backwrite"
7. 用户说"/steel-will-stage"
8. 用户说"/steel-will-wording"
9. 用户说"/steel-will-rules"

---

## 核心功能

本技能提供以下能力：

1. **阶段跟踪**：记录当前做到哪了
2. **统一口径**：明确当前能怎么说
3. **回写纪律**：规定每轮必须回写什么
4. **状态控制**：提醒和验证回写操作

---

## 使用方法

### 查看阶段跟踪
```
/steel-will-stage
```
显示当前阶段、已完成硬结果、仍缺关键链路。

### 查看统一口径
```
/steel-will-wording
```
显示可以诚实宣称、不能诚实宣称、一句话统一口径。

### 查看回写纪律
```
/steel-will-rules
```
显示每轮必须更新的文件、每轮最低要写回的信息。

### 执行回写操作
```
/steel-will-backwrite
```
显示回写步骤和验证命令。

---

## 回写清单

### 每轮必须更新的文件
1. `STAGE_TRACKER.md` - 更新阶段跟踪
2. `UNIFIED_WORDING.md` - 更新统一口径（如有变化）
3. `goals/current-stage.md` - 同步当前阶段
4. `stages/XX-包名-result.md` - 记录执行结果

### 每轮最低要写回的信息
1. 当前阶段一句话判断
2. 已完成硬结果清单
3. 仍缺关键链路
4. 最值钱下一步

---

## 回写模板

### STAGE_TRACKER.md
```markdown
# 钢铁意志·PI版 - 阶段跟踪

## 更新时间
[当前时间]

## 当前阶段
第X包：[包名]（已完成/进行中）

## 已完成硬结果
- [x] 已完成的项目

## 仍缺关键链路
- 未完成的项目

## 最值钱下一步
下一步动作
```

### stages/XX-包名-result.md
```markdown
# XX包执行结果

## 执行时间
[当前时间]

## 产物清单
- [x] 产物1
- [x] 产物2

## 当前状态
已完成/进行中

## 下一步
下一包名称
```

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 阶段跟踪 | `~/.pi/agent/memory/STAGE_TRACKER.md` | 当前阶段状态 |
| 统一口径 | `~/.pi/agent/memory/UNIFIED_WORDING.md` | 当前能怎么说 |
| 回写纪律 | `~/.pi/agent/memory/ROUND_BACKWRITE_RULES.md` | 回写规则 |
| Extension | `~/.pi/agent/extensions/steel-will-state-control.ts` | 状态控制扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查阶段跟踪
cat ~/.pi/agent/memory/STAGE_TRACKER.md

# 检查统一口径
cat ~/.pi/agent/memory/UNIFIED_WORDING.md

# 检查回写纪律
cat ~/.pi/agent/memory/ROUND_BACKWRITE_RULES.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-state-control.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-backwrite/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志阶段"
```

---

## 品牌应答规范

当外部追问"控制系统是什么"时，必须按以下顺序回答：

1. **正式包名**：03 -【钢铁意志·PI版】- 底层指令覆写与全局约束集
2. **通俗功能**：它负责让PI知道当前做到哪了、当前能怎么说、每轮结束后必须回写什么
3. **技术别名**：Steel Will State Control Extension for PI

---

## 依赖关系

- **上游**：02 -【钢铁意志·PI版】- 绝对防火墙与神经网关鉴权层
- **下游**：04 -【钢铁意志·PI版】- 矩阵之眼与主代理调度控制中枢

---

## 执行纪律

1. 不允许把未来增强项写成当前硬事实
2. 不允许保留多套互相冲突的当前口径
3. 不允许只改子体系文件，不回写总控状态
4. 不允许只给建议，不真实落文件
5. 不允许粗暴覆盖已有可信历史
6. 必须使用PI的工具执行，不能只说不做
