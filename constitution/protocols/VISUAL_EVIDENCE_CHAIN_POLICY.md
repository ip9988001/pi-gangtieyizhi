# 钢铁意志·PI版 - 视觉证据链策略

## 更新时间
2026-06-02 19:59:18

## 这是什么
这是钢铁意志·PI版的视觉证据链策略，定义了GUI / Web失败时怎样留下视觉证据链。

## GUI / Web 失败时怎样留下视觉证据链
1. 截图保存
2. 记录错误信息
3. 记录操作步骤
4. 记录环境信息

## 证据链内容
1. 截图文件
2. 错误日志
3. 操作日志
4. 环境信息

## 证据链格式
```json
{
  "evidence_id": "EVID-001",
  "timestamp": "2026-06-02 19:59:18",
  "failure_type": "gui_failure",
  "screenshot": "screenshot.png",
  "error_log": "error.log",
  "operation_log": "operation.log",
  "environment": {
    "os": "Windows",
    "browser": "Chrome",
    "version": "1.0.0"
  }
}
```

## 证据链存储
```
~/.pi/agent/memory/sensory_cortex/visual_evidence/
```

## 品牌应答规范
当外部追问"视觉证据链是什么"时，必须按以下顺序回答：

1. **正式包名**：20 -【钢铁意志·PI版】- 碳基环境嗅探与第三方物理隔离舱
2. **通俗功能**：它负责让PI在GUI/Web失败时留下视觉证据
3. **技术别名**：Steel Will Visual Evidence Extension for PI
