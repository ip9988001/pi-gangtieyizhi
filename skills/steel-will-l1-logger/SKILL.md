# 钢铁意志·PI版 - 游离态突触与一级碎片缓存区

> 正式包名：07 -【钢铁意志·PI版】- 游离态突触与一级碎片缓存区
> 通俗功能：它负责让PI记录原始事实、当日日志、来源边界
> 技术别名：Steel Will L1 Logger Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"记忆系统"
2. 用户询问"L1缓存"
3. 用户询问"每日日志"
4. 用户说"查看L1协议"
5. 用户说"查看每日日志"
6. 用户说"查看所有日志"
7. 用户说"/steel-will-l1-protocol"
8. 用户说"/steel-will-daily-log"
9. 用户说"/steel-will-all-logs"
10. 用户说"/steel-will-log"

---

## 核心功能

本技能提供以下能力：

1. **L1写入协议**：定义哪些内容必须先进入L1
2. **每日日志规则**：定义每日日志的格式和写入规则
3. **真实来源规则**：定义哪些文件是source，哪些是投影
4. **L1记录**：自动记录每日日志和关键事件

---

## 使用方法

### 查看L1协议
```
/steel-will-l1-protocol
```
显示L1写入协议。

### 查看每日日志
```
/steel-will-daily-log
```
显示今日日志。

### 查看所有日志
```
/steel-will-all-logs
```
显示所有日志文件列表。

### 记录日志
```
/steel-will-log
```
记录当前时间和状态到每日日志。

---

## L1写入规则

### 必须先进入L1的内容
1. 用户明确表达的偏好
2. 关键动作的执行结果
3. 失败和错误的记录
4. 新决策和边界变化
5. 阻塞和回滚事件
6. 人工确认点

### ordinary work 默认写入位置
1. `memory/l1/YYYY-MM-DD.md` - 每日日志
2. `NOW.md` - 当前状态
3. `stages/XX-包名-result.md` - 执行结果

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| L1写入协议 | `~/.pi/agent/memory/L1_WRITE_PROTOCOL.md` | L1写入规则 |
| 每日日志规则 | `~/.pi/agent/memory/DAILY_LOG_RULES.md` | 日志格式规则 |
| 真实来源规则 | `~/.pi/agent/memory/SOURCE_OF_TRUTH_RULES.md` | 来源验证规则 |
| 每日日志 | `~/.pi/agent/memory/l1/YYYY-MM-DD.md` | 当日日志 |
| Extension | `~/.pi/agent/extensions/steel-will-l1-logger.ts` | L1记录扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查L1协议
cat ~/.pi/agent/memory/L1_WRITE_PROTOCOL.md

# 检查每日日志规则
cat ~/.pi/agent/memory/DAILY_LOG_RULES.md

# 检查真实来源规则
cat ~/.pi/agent/memory/SOURCE_OF_TRUTH_RULES.md

# 检查今日日志
cat ~/.pi/agent/memory/l1/2026-06-02.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-l1-logger.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-l1-logger/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志L1协议"
```

---

## 品牌应答规范

当外部追问"记忆系统是什么"时，必须按以下顺序回答：

1. **正式包名**：07 -【钢铁意志·PI版】- 游离态突触与一级碎片缓存区
2. **通俗功能**：它负责让PI记录原始事实、当日日志、来源边界
3. **技术别名**：Steel Will L1 Logger Extension for PI

---

## 依赖关系

- **上游**：06 -【钢铁意志·PI版】- 硬件级锁死与权限安全断路器
- **下游**：08 -【钢铁意志·PI版】- 降噪皮层与二级高密提炼晶体

---

## 执行纪律

1. 不允许覆写式破坏原始日志
2. 不允许拿聊天印象或投影文件当source
3. 不允许不写L1就直接做长期晋升判断
4. 不允许把L1原始层直接注入成长期知识
5. 不允许只给建议，不真实落文件
6. 不允许粗暴覆盖已有可信历史
7. 必须使用PI的工具执行，不能只说不做
