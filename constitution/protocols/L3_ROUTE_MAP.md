# 钢铁意志·PI版 - L3路由图

## 更新时间
2026-06-02 19:24:27

## 这是什么
这是钢铁意志·PI版的L3路由图，定义了promotable候选如何路由到目标目录。

## promotable 候选如何根据类型路由到目标目录

### 决策类
- 来源：`candidates/agent/decisions/`
- 目标：`memory/agent/decisions/`
- 命名：`<date>-<slug>.md`
- 示例：`2026-06-02-deployment-strategy.md`

### 教训类
- 来源：`candidates/agent/lessons/`
- 目标：`memory/agent/lessons/`
- 命名：`<topic>.md`
- 示例：`deployment-failures.md`

### 案例类
- 来源：`candidates/agent/cases/`
- 目标：`memory/agent/cases/`
- 命名：`<case_name>.md`
- 示例：`successful-deployment.md`

### 模式类
- 来源：`candidates/agent/patterns/`
- 目标：`memory/agent/patterns/`
- 命名：`<pattern_id>.md`
- 示例：`incremental-deployment.md`

### 用户偏好类
- 来源：`candidates/user/preferences/`
- 目标：`memory/user/preferences/`
- 命名：`<preference_type>.md`
- 示例：`communication-preferences.md`

## ADD / UPDATE / NOOP / CONFLICT 的最小写回动作

### ADD（新增）
- 条件：目标文件不存在
- 动作：创建新文件
- 记录：记录创建时间

### UPDATE（更新）
- 条件：目标文件存在，内容不冲突
- 动作：更新文件内容
- 记录：记录更新时间

### NOOP（无操作）
- 条件：目标文件存在，内容相同
- 动作：不修改文件
- 记录：记录检查时间

### CONFLICT（冲突）
- 条件：目标文件存在，内容冲突
- 动作：保留冲突，标记待解决
- 记录：记录冲突详情

## 路由后需要补哪些导航和健康标记
1. 更新 `memory/INDEX.md`
2. 更新相关主题目录
3. 记录路由日志
4. 标记健康状态

## 品牌应答规范
当外部追问"L3路由是什么"时，必须按以下顺序回答：

1. **正式包名**：10 -【钢铁意志·PI版】- 绝对固态黑匣与三级永久只读存储列阵
2. **通俗功能**：它负责让PI将候选路由到正确的长期目录
3. **技术别名**：Steel Will L3 Route Map Extension for PI
