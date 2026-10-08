# 钢铁意志·PI版 - 包24：降维捕获网与向量级语义雷达

## 正式包名
24 -【钢铁意志·PI版】- 降维捕获网与向量级语义雷达

## 通俗功能
语义检索增强、查询路由、结果过滤、新鲜度加权

## 技术别名
Steel Will Vector Radar & Query Router

## 触发条件
当需要：
- 对查询进行路由分类
- 过滤recall结果
- 检查读取预算
- 扩展中文别名提高召回率

## 已注册工具

### 1. route_query
对查询进行路由分类，确定默认recall路径。

**查询类型**：
- status: 状态查询 → S1
- preference: 偏好查询 → S1
- decision: 决策查询 → S2
- case: 案例查询 → S2
- timeline: 时间线查询 → S2
- fuzzy: 模糊回忆 → S2

### 2. filter_results
过滤recall结果，压制低质量条目。

**过滤规则**：
- stale: 过时条目 → 压制
- conflict: 冲突条目 → 可选保留
- superseded: 被取代条目 → 压制
- partial: 部分条目 → 压制

**降权规则**：
- freshness=stale → 权重×0.7
- freshness=unverified → 权重×0.5
- state=conflict → 权重×0.5

### 3. check_read_budget
检查当前查询的读取预算。

**预算分档**：
- R0: 快速检索，最多3个结果
- R1: 语义检索，最多5个结果
- R2: 深度检索，最多10个结果

**分配规则**：
- status/preference → R0
- decision/case/timeline/fuzzy → R1
- 复杂问题 → R2

### 4. expand_chinese_aliases
扩展中文别名和同义词。

**别名映射示例**：
- 重启 → restart, reboot, 重新启动
- 部署 → deploy, release, 发布
- 配置 → config, setting, 设置
- 错误 → error, bug, 故障

## 已注册命令

### /vector-radar-status
查看向量雷达模块状态

## 查询路由规则

| 查询类型 | 默认路径 | 说明 |
|---------|---------|------|
| status | S1 | 状态查询，快速检索 |
| preference | S1 | 偏好查询，快速检索 |
| decision | S2 | 决策查询，语义检索 |
| case | S2 | 案例查询，语义检索 |
| timeline | S2 | 时间线查询，语义检索 |
| fuzzy | S2 | 模糊回忆，语义检索 |

## 读取预算规则

| 预算级别 | 最大结果 | 最大深度 | 适用场景 |
|---------|---------|---------|---------|
| R0 | 3 | 1 | 状态/偏好查询 |
| R1 | 5 | 2 | 决策/案例/时间线/模糊查询 |
| R2 | 10 | 3 | 复杂问题 |

## 使用场景

1. **查询前路由**：在进入recall前，调用route_query确定路径
2. **结果过滤**：recall后调用filter_results过滤低质量结果
3. **预算控制**：调用check_read_budget确定读取深度
4. **别名扩展**：中文查询时调用expand_chinese_aliases提高召回率
