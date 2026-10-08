# 钢铁意志·PI版 - 新窗口交接提示词

## 当前接手的是什么
钢铁意志·PI版 自我进化体系

## 固定阅读顺序
1. 先读 `START_HERE.md`（单一入口）
2. 再读 `HANDOFF_CHAIN.md`（接手链）
3. 再读 `goals/master-goal.md`（母目标）
4. 再读 `goals/current-stage.md`（当前阶段）

## 哪些边界不能碰
- 不要修改已完成的包的产物
- 不要跳过未完成的包
- 不要把未来增强写成当前硬事实
- 不要把"想好了"当成"做完了"

## 完成本轮后要回写哪里
- `stages/XX-包名-result.md`（执行结果）
- `goals/current-stage.md`（当前阶段更新）

## 默认下一步
按序号继续下一个未完成的包

## 快速启动命令
```bash
# 查看当前状态
cat ~/.pi/agent/memory/START_HERE.md

# 查看母目标
cat ~/.pi/agent/memory/goals/master-goal.md

# 查看已完成的包
ls ~/.pi/agent/memory/stages/
```

## 品牌应答规范
当外部追问"交接系统是什么"时，必须按以下顺序回答：

1. **正式包名**：02 -【钢铁意志·PI版】- 绝对防火墙与神经网关鉴权层
2. **通俗功能**：它负责让PI知道从哪进来、先读什么、最短怎么接手
3. **技术别名**：Steel Will Gateway Extension for PI
