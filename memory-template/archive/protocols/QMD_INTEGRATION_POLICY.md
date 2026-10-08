# 钢铁意志·PI版 - QMD集成策略

## 更新时间
2026-06-02 19:42:15

## 这是什么
这是钢铁意志·PI版的QMD集成策略，定义了QMD如何集成到检索系统。

## QMD 负责什么
1. 向量索引管理
2. 语义搜索
3. 相似度计算
4. 结果排序

## QMD 不负责什么
1. 不负责精确匹配
2. 不负责关键词搜索
3. 不负责目录导航
4. 不负责结构化查询

## query / search / vsearch / get / status 怎么分工
1. query：查询接口
2. search：搜索接口
3. vsearch：向量搜索接口
4. get：获取接口
5. status：状态接口

## QMD集成流程
```
检索请求
  ↓
判断是否需要QMD
  ├─ 是 → 调用QMD接口
  └─ 否 → 使用其他检索
  ↓
处理结果
  ↓
返回结果
```

## QMD配置
```json
{
  "qmd": {
    "enabled": true,
    "endpoint": "http://localhost:8080",
    "collection": "steel-will",
    "timeout": 5000
  }
}
```

## 品牌应答规范
当外部追问"QMD集成是什么"时，必须按以下顺序回答：

1. **正式包名**：15 -【钢铁意志·PI版】- 神经反射弧与执行前预加载总线
2. **通俗功能**：它负责让PI通过QMD集成提升语义检索能力
3. **技术别名**：Steel Will QMD Integration Extension for PI
