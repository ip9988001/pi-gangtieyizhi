# 钢铁意志·PI版 - 逻辑淬火池与无损熵减转化引擎

> 正式包名：09 -【钢铁意志·PI版】- 逻辑淬火池与无损熵减转化引擎
> 通俗功能：它负责让PI筛选值得保留的事实，生成候选条目
> 技术别名：Steel Will Candidate Screener Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"候选筛选"
2. 用户询问"L2候选池"
3. 用户询问"Heartbeat筛选"
4. 用户说"查看Heartbeat筛选协议"
5. 用户说"查看L2候选池规则"
6. 用户说"查看候选状态规则"
7. 用户说"查看所有候选"
8. 用户说"/steel-will-heartbeat"
9. 用户说"/steel-will-candidate-pool"
10. 用户说"/steel-will-candidate-status"
11. 用户说"/steel-will-candidates"

---

## 核心功能

本技能提供以下能力：

1. **Heartbeat筛选协议**：定义Heartbeat的定位和初筛规则
2. **每日日志同步规则**：定义多来源日志如何同步
3. **L2候选池规则**：定义什么适合进入L2
4. **候选状态规则**：定义候选条目的各种状态

---

## 使用方法

### 查看Heartbeat筛选协议
```
/steel-will-heartbeat
```
显示Heartbeat的定位和初筛规则。

### 查看L2候选池规则
```
/steel-will-candidate-pool
```
显示什么适合进入L2，什么只留日志。

### 查看候选状态规则
```
/steel-will-candidate-status
```
显示候选条目的各种状态。

### 查看所有候选
```
/steel-will-candidates
```
显示所有候选条目。

---

## Heartbeat定位

### 日间整合器
- 负责日间整合，不是夜间深反思
- 处理轻量级判断，不处理复杂分析
- 保持低噪音，不产生干扰
- 快速执行，不消耗过多资源

### 初筛规则
1. 事实是否明确
2. 事实是否重要
3. 事实是否值得保留
4. 事实属于user还是agent

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| Heartbeat筛选协议 | `~/.pi/agent/memory/HEARTBEAT_SCREENING_PROTOCOL.md` | Heartbeat定位 |
| 每日日志同步规则 | `~/.pi/agent/memory/DAILY_LOG_SYNC_RULES.md` | 日志同步规则 |
| L2候选池规则 | `~/.pi/agent/memory/L2_CANDIDATE_POOL_RULES.md` | 候选池规则 |
| 候选状态规则 | `~/.pi/agent/memory/CANDIDATE_STATUS_RULES.md` | 状态转换规则 |
| 用户候选 | `~/.pi/agent/memory/candidates/user/` | 用户相关候选 |
| Agent候选 | `~/.pi/agent/memory/candidates/agent/` | Agent相关候选 |
| Extension | `~/.pi/agent/extensions/steel-will-candidate-screener.ts` | 候选筛选扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查Heartbeat筛选协议
cat ~/.pi/agent/memory/HEARTBEAT_SCREENING_PROTOCOL.md

# 检查L2候选池规则
cat ~/.pi/agent/memory/L2_CANDIDATE_POOL_RULES.md

# 检查候选状态规则
cat ~/.pi/agent/memory/CANDIDATE_STATUS_RULES.md

# 检查候选目录
ls -la ~/.pi/agent/memory/candidates/user/
ls -la ~/.pi/agent/memory/candidates/agent/

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-candidate-screener.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-candidate-screener/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志Heartbeat筛选协议"
```

---

## 品牌应答规范

当外部追问"经验转化系统是什么"时，必须按以下顺序回答：

1. **正式包名**：09 -【钢铁意志·PI版】- 逻辑淬火池与无损熵减转化引擎
2. **通俗功能**：它负责让PI筛选值得保留的事实，生成候选条目
3. **技术别名**：Steel Will Candidate Screener Extension for PI

---

## 依赖关系

- **上游**：08 -【钢铁意志·PI版】- 降噪皮层与二级高密提炼晶体
- **下游**：10 -【钢铁意志·PI版】- 绝对固态黑匣与三级永久只读存储列阵

---

## 执行纪律

1. 不允许把 Heartbeat 写成 nightly reflection
2. 不允许把 `L2` 当垃圾桶，什么都往里扔
3. 不允许没有锚点就生成候选条目
4. 不允许候选条目没有状态
5. 不允许只给建议，不真实落文件
6. 不允许粗暴覆盖已有可信历史
7. 必须使用PI的工具执行，不能只说不做
