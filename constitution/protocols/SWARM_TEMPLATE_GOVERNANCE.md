# 钢铁意志·PI版 - 蜂群模板治理

## 更新时间
2026-06-02 19:55:32

## 这是什么
这是钢铁意志·PI版的蜂群模板治理，定义了genealogy_templates和evolutionary_graveyard的分工。

## genealogy_templates 负责什么
1. 存储成功的协作模板
2. 记录模板的演化历史
3. 提供模板复用
4. 支持模板优化

## evolutionary_graveyard 负责什么
1. 存储失败的协作模板
2. 记录失败原因
3. 提供失败教训
4. 支持失败学习

## 模板治理流程
```
协作完成
  ↓
判断是否成功
  ├─ 成功 → 存储到genealogy_templates
  └─ 失败 → 存储到evolutionary_graveyard
  ↓
记录模板信息
  ↓
更新模板索引
```

## 模板格式
```json
{
  "template_id": "TPL-001",
  "template_name": "并行部署模板",
  "template_type": "genealogy",
  "task_pattern": "deployment",
  "node_count": 3,
  "success_rate": 0.95,
  "created_at": "2026-06-02 19:55:32"
}
```

## 品牌应答规范
当外部追问"蜂群模板是什么"时，必须按以下顺序回答：

1. **正式包名**：19 -【钢铁意志·PI版】- 纳米蜂群裂变与多维子代理并发矩阵
2. **通俗功能**：它负责让PI管理协作模板，支持模板复用和学习
3. **技术别名**：Steel Will Template Extension for PI
