# 钢铁意志·PI版 - Experience Bundle模式

## 更新时间
2026-06-02 19:45:32

## 这是什么
这是钢铁意志·PI版的Experience Bundle模式，定义了Experience Bundle的最小字段。

## Experience Bundle 最小字段
```json
{
  "bundle_id": "EB-001",
  "task_type": "deployment",
  "domain": "agent",
  "phase": "execution",
  "risks": ["risk1", "risk2"],
  "anti_patterns": ["anti_pattern1", "anti_pattern2"],
  "lessons": ["lesson1", "lesson2"],
  "recommended_moves": ["move1", "move2"],
  "sources": ["source1", "source2"],
  "created_at": "2026-06-02 19:45:32",
  "status": "active"
}
```

## 字段说明
1. bundle_id：Bundle唯一标识
2. task_type：任务类型
3. domain：领域（user/agent）
4. phase：阶段（planning/execution/review）
5. risks：风险列表
6. anti_patterns：反模式列表
7. lessons：教训列表
8. recommended_moves：建议动作列表
9. sources：来源引用列表
10. created_at：创建时间
11. status：状态（active/archived）

## Bundle格式
```markdown
# [Bundle标题]

## 元数据
- Bundle ID：[ID]
- 任务类型：[类型]
- 领域：[user/agent]
- 阶段：[planning/execution/review]
- 状态：[active/archived]
- 创建时间：[时间]

## 风险
- [风险1]
- [风险2]

## 反模式
- [反模式1]
- [反模式2]

## 教训
- [教训1]
- [教训2]

## 建议动作
- [动作1]
- [动作2]

## 来源
- [来源1]
- [来源2]
```

## 品牌应答规范
当外部追问"经验注入系统是什么"时，必须按以下顺序回答：

1. **正式包名**：16 -【钢铁意志·PI版】- 战术外骨骼与动态经验热插拔模块
2. **通俗功能**：它负责让PI在执行前注入相关经验，避免重复犯错
3. **技术别名**：Steel Will Experience Injector Extension for PI
