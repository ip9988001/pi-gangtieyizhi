# 钢铁意志·PI版 - 真实工作区验收规则

## 更新时间
2026-06-02 20:03:25

## 这是什么
这是钢铁意志·PI版的真实工作区验收规则，定义了启动验收读取顺序和Pass/Partial/Fail。

## 启动验收读取顺序
1. 读取AGENTS.md
2. 读取HEARTBEAT.md
3. 复述NOW.md
4. 读取system/protection_status.json
5. 读取system/capability_profile.json
6. 读取assets/registry.json或确认其当前状态
7. 从memory/INDEX.md找到前台入口

## Pass / Partial / Fail
### Pass
- 所有文件存在且可读
- 所有配置正确
- 所有服务正常
- 所有验证通过

### Partial
- 部分文件存在且可读
- 部分配置正确
- 部分服务正常
- 部分验证通过

### Fail
- 关键文件不存在
- 关键配置错误
- 关键服务异常
- 关键验证失败

## 第一条低风险真实任务结束后最少回写哪些状态面
1. memory/YYYY-MM-DD.md - 每日日志
2. NOW.md - 当前状态
3. system/ledger.json - 审计账本
4. system/capability_profile.json - 能力配置

## 验收流程
```
启动验收
  ↓
按顺序读取文件
  ↓
验证文件内容
  ↓
判断Pass/Partial/Fail
  ├─ Pass → 正常运行
  ├─ Partial → 降级运行
  └─ Fail → 阻断运行
  ↓
记录验收结果
```

## 品牌应答规范
当外部追问"验收规则是什么"时，必须按以下顺序回答：

1. **正式包名**：21 -【钢铁意志·PI版】- 协议同化港与跨环境无损平滑迁移簇
2. **通俗功能**：它负责让PI验证工作区是否正常
3. **技术别名**：Steel Will Acceptance Extension for PI
