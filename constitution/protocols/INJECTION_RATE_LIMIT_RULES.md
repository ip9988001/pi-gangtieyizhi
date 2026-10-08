# 钢铁意志·PI版 - 注入限流规则

## 更新时间
2026-06-02 19:45:32

## 这是什么
这是钢铁意志·PI版的注入限流规则，定义了条数上限、跳过条件和降级条件。

## 条数上限
1. 每次注入最多5条经验
2. 每条经验最多500字
3. 每次注入最多2500字

## 跳过条件
1. 经验与当前任务无关
2. 经验已被注入过
3. 经验状态为禁止注入
4. 经验来源不可靠

## 降级条件
1. 注入内容过多
2. 注入时间过长
3. 注入资源不足
4. 注入发生错误

## 限流流程
```
注入请求
  ↓
检查限流规则
  ├─ 允许 → 执行注入
  └─ 禁止 → 跳过或降级
  ↓
记录注入日志
```

## 限流配置
```json
{
  "max_items": 5,
  "max_chars_per_item": 500,
  "max_total_chars": 2500,
  "skip_conditions": ["irrelevant", "already_injected", "forbidden_status", "unreliable_source"],
  "degradation_conditions": ["too_much_content", "too_long_time", "insufficient_resources", "error"]
}
```

## 品牌应答规范
当外部追问"注入限流是什么"时，必须按以下顺序回答：

1. **正式包名**：16 -【钢铁意志·PI版】- 战术外骨骼与动态经验热插拔模块
2. **通俗功能**：它负责让PI控制经验注入的数量和质量
3. **技术别名**：Steel Will Rate Limit Extension for PI
