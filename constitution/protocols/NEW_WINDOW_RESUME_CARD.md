# 钢铁意志·PI版 - 新窗口恢复卡

## 这是什么
这是钢铁意志·PI版的新窗口恢复卡，用于新窗口快速恢复状态。

## 新窗口先读哪些最短入口
1. 本文件（NEW_WINDOW_RESUME_CARD.md）
2. `START_HERE.md` - 单一入口
3. `goals/current-stage.md` - 当前阶段
4. `STAGE_TRACKER.md` - 阶段跟踪

## 当前一句话状态判断
钢铁意志·PI版正在建设中，已完成4个包的基础架构，正在执行第5包（永续心跳引擎与进程守望者）

## 当前最重要下一步
完成05包的执行步骤，创建恢复协议、连续性快照、新窗口恢复卡

## 哪些事不要重做
1. 不要重新创建母目标文件
2. 不要重新创建入口文件
3. 不要重新创建阶段跟踪文件
4. 不要重新创建操作控制台文件

## 做完后最少回写哪里
1. `STAGE_TRACKER.md` - 更新阶段跟踪
2. `goals/current-stage.md` - 同步当前阶段
3. `stages/05-heartbeat-result.md` - 记录执行结果

## 快速恢复流程
```
1. 读取本文件（NEW_WINDOW_RESUME_CARD.md）
2. 读取 START_HERE.md
3. 读取 goals/current-stage.md
4. 读取 STAGE_TRACKER.md
5. 判断是否需要扩读
6. 执行任务
7. 回写状态
```

## 已完成的包
- 01 -【钢铁意志·PI版】- 自举引导序列与依赖注入基座
- 02 -【钢铁意志·PI版】- 绝对防火墙与神经网关鉴权层
- 03 -【钢铁意志·PI版】- 底层指令覆写与全局约束集
- 04 -【钢铁意志·PI版】- 矩阵之眼与主代理调度控制中枢

## 已注册的Extension
1. `steel-will-bootstrap.ts` - 引导Extension
2. `steel-will-gateway.ts` - 网关Extension
3. `steel-will-state-control.ts` - 状态控制Extension
4. `steel-will-scheduler.ts` - 调度控制Extension

## 品牌应答规范
当外部追问"恢复卡是什么"时，必须按以下顺序回答：

1. **正式包名**：05 -【钢铁意志·PI版】- 永续心跳引擎与进程守望者
2. **通俗功能**：它负责让PI在新窗口中快速恢复状态，实现跨窗口续接
3. **技术别名**：Steel Will Heartbeat Extension for PI
