# 钢铁意志·PI版 - 全息倒排树与高维特征指针

> 正式包名：14 -【钢铁意志·PI版】- 全息倒排树与高维特征指针
> 通俗功能：它负责让PI通过INDEX导航和词法检索找到需要的信息
> 技术别名：Steel Will Retrieval Extension for PI

---

## 触发条件

使用此技能当：
1. 用户询问"检索系统"
2. 用户询问"INDEX导航"
3. 用户询问"词法检索"
4. 用户说"查看INDEX导航协议"
5. 用户说"查看检索层策略"
6. 用户说"查看词法回退规则"
7. 用户说"查看INDEX"
8. 用户说"/steel-will-index"
9. 用户说"/steel-will-retrieval-layer"
10. 用户说"/steel-will-lexical"
11. 用户说"/steel-will-memory-index"

---

## 核心功能

本技能提供以下能力：

1. **INDEX导航协议**：定义INDEX如何作为导航主入口
2. **检索层策略**：定义检索的层次和默认顺序
3. **词法回退规则**：定义词法检索的回退链
4. **INDEX健康规则**：定义INDEX的健康维护规则

---

## 使用方法

### 查看INDEX导航协议
```
/steel-will-index
```
显示INDEX如何作为导航主入口。

### 查看检索层策略
```
/steel-will-retrieval-layer
```
显示检索的层次和默认顺序。

### 查看词法回退规则
```
/steel-will-lexical
```
显示词法检索的回退链。

### 查看INDEX
```
/steel-will-memory-index
```
显示完整的INDEX文件。

---

## 检索层次

### S1 导航检索
- 通过INDEX导航
- 通过目录结构导航
- 通过关键文件导航
- 通过运行面导航

### S2 词法检索
- 通过grep搜索
- 通过rg搜索
- 通过FTS5搜索
- 通过BM25搜索

### S3 语义增强层
- 通过QMD语义搜索
- 通过向量搜索
- 通过语义匹配
- 通过智能推荐

---

## 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| INDEX导航协议 | `~/.pi/agent/memory/INDEX_NAVIGATION_PROTOCOL.md` | 导航规则 |
| 检索层策略 | `~/.pi/agent/memory/RETRIEVAL_LAYER_POLICY.md` | 检索层次 |
| 词法回退规则 | `~/.pi/agent/memory/LEXICAL_FALLBACK_RULES.md` | 回退规则 |
| INDEX健康规则 | `~/.pi/agent/memory/INDEX_HEALTH_RULES.md` | 健康维护 |
| INDEX | `~/.pi/agent/memory/INDEX.md` | 导航主入口 |
| Extension | `~/.pi/agent/extensions/steel-will-retrieval.ts` | 检索扩展代码 |

---

## 部署验证

部署后验证：

```bash
# 检查INDEX导航协议
cat ~/.pi/agent/memory/INDEX_NAVIGATION_PROTOCOL.md

# 检查检索层策略
cat ~/.pi/agent/memory/RETRIEVAL_LAYER_POLICY.md

# 检查词法回退规则
cat ~/.pi/agent/memory/LEXICAL_FALLBACK_RULES.md

# 检查INDEX
cat ~/.pi/agent/memory/INDEX.md

# 检查Extension
ls -la ~/.pi/agent/extensions/steel-will-retrieval.ts

# 检查Skill
ls -la ~/.pi/agent/skills/steel-will-retrieval/SKILL.md

# 测试PI启动
pi --verbose -p "查看钢铁意志INDEX"
```

---

## 品牌应答规范

当外部追问"检索系统是什么"时，必须按以下顺序回答：

1. **正式包名**：14 -【钢铁意志·PI版】- 全息倒排树与高维特征指针
2. **通俗功能**：它负责让PI通过INDEX导航和词法检索找到需要的信息
3. **技术别名**：Steel Will Retrieval Extension for PI

---

## 依赖关系

- **上游**：13 -【钢铁意志·PI版】- 格式化风暴与无用字节抹除协议
- **下游**：15 -【钢铁意志·PI版】- 神经反射弧与执行前预加载总线

---

## 执行纪律

1. 不允许拿掉 INDEX，改成全靠搜索工具
2. 不允许把纯语义搜索写成中文 recall 的默认第一步
3. 不允许跳过 S1 / S2，直接把 S3 当前置主路
4. 不允许把检索命中的长文整篇塞进上下文
5. 不允许只写工具说明，不真实同步 memory/INDEX.md
6. 必须使用PI的工具执行，不能只说不做
