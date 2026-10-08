# 钢铁意志·PI版 - 回滚策略

## 更新时间
2026-06-02 19:52:02

## 这是什么
这是钢铁意志·PI版的回滚策略，定义了rollback_ref什么时候必须提前存在。

## rollback_ref 什么时候必须提前存在
1. 高风险任务执行前
2. 不可逆操作前
3. 批量操作前
4. 系统修改前

## rollback_ref字段
```json
{
  "rollback_id": "ROLLBACK-001",
  "task_id": "TASK-001",
  "rollback_type": "file_restore",
  "rollback_data": {
    "files": ["file1.md", "file2.md"],
    "backup_path": "/backup/2026-06-02/"
  },
  "created_at": "2026-06-02 19:52:02"
}
```

## 回滚流程
```
任务失败
  ↓
检查rollback_ref
  ├─ 存在 → 执行回滚
  └─ 不存在 → 记录错误
  ↓
恢复系统状态
  ↓
记录回滚日志
```

## 回滚类型
1. file_restore：文件恢复
2. config_restore：配置恢复
3. data_restore：数据恢复
4. system_restore：系统恢复

## 品牌应答规范
当外部追问"回滚策略是什么"时，必须按以下顺序回答：

1. **正式包名**：18 -【钢铁意志·PI版】- 不可篡改哈希行为审计链与防错回滚轴
2. **通俗功能**：它负责让PI在任务失败时回滚到安全状态
3. **技术别名**：Steel Will Rollback Extension for PI
