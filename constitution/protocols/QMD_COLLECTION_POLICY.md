# 钢铁意志·PI版 - QMD集合策略

## 更新时间
2026-06-02 19:42:15

## 这是什么
这是钢铁意志·PI版的QMD集合策略，定义了QMD集合如何管理。

## QMD集合定义
QMD集合是向量索引的容器，用于存储和管理向量数据。

## 集合管理规则
1. 集合命名：使用有意义的名称
2. 集合创建：按需创建
3. 集合更新：定期更新
4. 集合删除：谨慎删除

## 集合命名规则
```
steel-will-{type}-{domain}
```
- type：类型（memory, pattern, lesson等）
- domain：域（user, agent）

## 集合示例
1. steel-will-memory-agent - Agent记忆集合
2. steel-will-memory-user - 用户记忆集合
3. steel-will-pattern-agent - 模式集合
4. steel-will-lesson-agent - 教训集合

## 集合健康检查
```bash
# 检查集合状态
curl http://localhost:8080/status

# 检查集合列表
curl http://localhost:8080/collections

# 检查集合详情
curl http://localhost:8080/collections/steel-will-memory-agent
```

## 品牌应答规范
当外部追问"QMD集合是什么"时，必须按以下顺序回答：

1. **正式包名**：15 -【钢铁意志·PI版】- 神经反射弧与执行前预加载总线
2. **通俗功能**：它负责让PI管理QMD集合
3. **技术别名**：Steel Will QMD Collection Extension for PI
