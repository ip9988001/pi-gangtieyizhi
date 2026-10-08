# 钢铁意志·PI版 - 降噪皮层与二级高密提炼晶体

> 正式包名：08 -【钢铁意志·PI版】- 降噪皮层与二级高密提炼晶体
> 通俗功能：它负责让PI区分用户记忆和Agent记忆，建立记忆骨架
> 技术别名：Steel Will Memory Skeleton Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"记忆结构"
2. 用户询问"记忆域"
3. 用户询问"记忆骨架"
4. 用户说"查看记忆域策略"
5. 用户说"查看记忆骨架"
6. 用户说"查看记忆目录映射"
7. 用户说"查看记忆结构"
8. 用户说"/steel-will-memory-domain"
9. 用户说"/steel-will-memory-skeleton"
10. 用户说"/steel-will-memory-map"
11. 用户说"/steel-will-memory-structure"

---

## 核心功能

本技能提供以下能力：

1. **记忆域策略**：定义User Memory和Agent Memory的职责
2. **记忆骨架**：定义记忆目录的最小结构
3. **记忆目录映射**：定义所有记忆目录的详细结构
4. **记忆结构查看**：查看当前记忆目录结构

---

## 使用方法

### 查看记忆域策略
```
/steel-will-memory-domain
```
显示User Memory和Agent Memory的职责划分。

### 查看记忆骨架
```
/steel-will-memory-skeleton
```
显示记忆目录的最小结构。

### 查看记忆目录映射
```
/steel-will-memory-map
```
显示所有记忆目录的详细结构。

### 查看记忆结构
```
/steel-will-memory-structure
```
显示当前记忆目录的实际结构。

---

## 记忆域划分

### User Memory
- 用户偏好
- 沟通风格
- 工作习惯
- 审批规则
- 边界控制

### Agent Memory
- 决策记录
- 失败教训
- 成功案例
- 工作模式
- 项目状态

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| 记忆域策略 | `~/.pi/agent/memory/MEMORY_DOMAIN_POLICY.md` | 域职责划分 |
| 记忆骨架 | `~/.pi/agent/memory/MEMORY_SKELETON.md` | 最小目录结构 |
| 记忆目录映射 | `~/.pi/agent/memory/MEMORY_DIRECTORY_MAP.md` | 详细目录结构 |
| Extension | `~/.pi/agent/extensions/steel-will-memory-skeleton.ts` | 记忆骨架扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查记忆域策略
cat ~/.pi/agent/memory/MEMORY_DOMAIN_POLICY.md

# 检查记忆骨架
cat ~/.pi/agent/memory/MEMORY_SKELETON.md

# 检查记忆目录映射
cat ~/.pi/agent/memory/MEMORY_DIRECTORY_MAP.md

# 检查目录结构
ls -la ~/.pi/agent/memory/user/
ls -la ~/.pi/agent/memory/agent/
ls -la ~/.pi/agent/memory/candidates/

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-memory-skeleton.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-memory-skeleton/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志记忆域策略"
```

---

## 品牌应答规范

当外部追问"记忆提炼层是什么"时，必须按以下顺序回答：

1. **正式包名**：08 -【钢铁意志·PI版】- 降噪皮层与二级高密提炼晶体
2. **通俗功能**：它负责让PI区分用户记忆和Agent记忆，建立记忆骨架
3. **技术别名**：Steel Will Memory Skeleton Extension for PI

---

## 依赖关系

- **上游**：07 -【钢铁意志·PI版】- 游离态突触与一级碎片缓存区
- **下游**：09 -【钢铁意志·PI版】- 逻辑淬火池与无损熵减转化引擎

---

## 执行纪律

1. 不允许把 User Memory 和 Agent Memory 混成一个大仓
2. 不允许把 `.archive/` 当成删除桶
3. 不允许只画目录图，不真实建目录和落文件
4. 不允许粗暴覆盖已有可信历史
5. 必须使用PI的工具执行，不能只说不做
