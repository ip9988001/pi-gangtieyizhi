# 钢铁意志·PI版 - Bootstrap证据策略

## 更新时间
2026-06-02 20:03:25

## 这是什么
这是钢铁意志·PI版的Bootstrap证据策略，定义了real_PI记忆体系_bootstrap_001/的文件职责。

## real_PI记忆体系_bootstrap_001/ 的文件职责
1. 00_TARGET_WORKSPACE_PROFILE.md - 目标工作区配置
2. 01_BACKUP_RECORD.md - 备份记录
3. 02_STARTUP_ACCEPTANCE.md - 启动验收
4. 03_STATE_WRITE_EVIDENCE.md - 状态写入证据
5. 04_BOOTSTRAP_CLOSURE_SUMMARY.md - Bootstrap闭合总结

## artifacts 目录职责
1. 存储Bootstrap过程中的产物
2. 存储验证结果
3. 存储审计日志
4. 存储回滚数据

## 为什么必须保留 draft / preflight / approved / execution / closure
1. draft：草稿阶段，记录初始想法
2. preflight：预检阶段，验证可行性
3. approved：批准阶段，获得授权
4. execution：执行阶段，实施操作
5. closure：闭合阶段，总结经验

## 证据格式
```json
{
  "evidence_id": "EVID-001",
  "stage": "execution",
  "timestamp": "2026-06-02 20:03:25",
  "action": "bootstrap_deployment",
  "result": "success",
  "details": "Bootstrap部署成功"
}
```

## 品牌应答规范
当外部追问"Bootstrap证据是什么"时，必须按以下顺序回答：

1. **正式包名**：21 -【钢铁意志·PI版】- 协议同化港与跨环境无损平滑迁移簇
2. **通俗功能**：它负责让PI记录Bootstrap过程中的证据
3. **技术别名**：Steel Will Bootstrap Evidence Extension for PI
