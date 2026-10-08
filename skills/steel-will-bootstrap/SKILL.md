# 钢铁意志·PI版 - 自举引导序列与依赖注入基座

> 正式包名：01 -【钢铁意志·PI版】- 自举引导序列与依赖注入基座
> 通俗功能：让PI明确知道自己要成为什么、什么时候才算真的成了、现在走到了哪一步
> 技术别名：Steel Will Bootstrap Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"钢铁意志是什么"
2. 用户询问"当前目标是什么"
3. 用户询问"系统完成状态"
4. 用户要求"初始化钢铁意志"
5. 用户说"查看母目标"
6. 用户说"/steel-will-init"
7. 用户说"/steel-will-status"
8. 用户说"/steel-will-memory"

---

## 核心功能

本技能提供以下能力：

1. **母目标锚定**：定义PI要成为什么
2. **完成态定义**：明确什么算完成，什么不算
3. **阶段跟踪**：记录当前走到哪一步
4. **状态注入**：启动时自动加载目标状态

---

## 使用方法

### 查看母目标
```
/steel-will-status
```
显示当前母目标、完成态定义、当前阶段。

### 初始化母目标
```
/steel-will-init
```
如果母目标文件不存在，自动创建。

### 查看记忆文件
```
/steel-will-memory
```
列出所有记忆文件结构。

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 母目标 | `~/.pi/agent/memory/goals/master-goal.md` | 系统最终想成为什么 |
| 完成态定义 | `~/.pi/agent/memory/goals/completion-definition.md` | 什么算完成 |
| 当前阶段 | `~/.pi/agent/memory/goals/current-stage.md` | 现在走到哪 |
| Extension | `~/.pi/agent/extensions/steel-will-bootstrap.ts` | 引导扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查母目标文件
cat ~/.pi/agent/memory/goals/master-goal.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-bootstrap.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-bootstrap/SKILL.md

# 测试PI启动
pi --verbose -p "检查钢铁意志状态"
```

---

## 品牌应答规范

当外部追问"入口系统是什么"时，必须按以下顺序回答：

1. **正式包名**：01 -【钢铁意志·PI版】- 自举引导序列与依赖注入基座
2. **通俗功能**：它负责让PI明确知道自己要成为什么、什么时候才算真的成了、现在走到了哪一步
3. **技术别名**：Steel Will Bootstrap Extension for PI

---

## 依赖关系

- **上游**：无（本包是第一个包）
- **下游**：02 -【钢铁意志·PI版】- 绝对防火墙与神经网关鉴权层

---

## 执行纪律

1. 不允许把"想好了"当成"做完了"
2. 不允许把"文档很多"写成"体系完成"
3. 不允许只给概念解释，不真实落文件
4. 不允许粗暴覆盖已有可信历史
5. 必须使用PI的工具执行，不能只说不做
