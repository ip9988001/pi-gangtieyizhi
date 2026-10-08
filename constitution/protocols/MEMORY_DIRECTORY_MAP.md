## 这是什么
这是钢铁意志·PI版的记忆目录映射，定义了所有记忆目录的详细结构。

## memory/user/ 目录结构
```
memory/user/
├── profile/          # 用户基本信息
├── preferences/      # 用户偏好
│   ├── COMMUNICATION_PREFERENCES.md
│   ├── WORK_PREFERENCES.md
│   └── APPROVAL_AND_BOUNDARIES.md
├── people/           # 用户联系人
└── events/           # 用户事件
```

## memory/agent/ 目录结构
```
memory/agent/
├── decisions/        # 决策记录
├── lessons/          # 失败教训
├── cases/            # 成功案例
├── patterns/         # 工作模式
├── projects/         # 项目状态
├── reflections/      # 系统反思
├── actions/          # 操作日志
└── system/           # 系统配置
```

## memory/candidates/ 目录结构
```
memory/candidates/
├── user/             # 用户相关候选
└── agent/            # Agent相关候选
```

## memory/.archive/ 目录结构
```
memory/.archive/      # 存档目录
```

## memory/l1/ 目录结构
```
memory/l1/            # L1原始碎片
├── YYYY-MM-DD.md     # 每日日志
└── ...
```

## memory/stages/ 目录结构
```
memory/stages/        # 执行结果
├── 01-bootstrap-result.md
├── 02-gateway-result.md
└── ...
```

## 根层前台文件
```
~/.pi/agent/memory/
├── START_HERE.md              # 单一入口
├── HANDOFF_CHAIN.md           # 接手链
├── NEW_WINDOW_RESUME_CARD.md  # 新窗口恢复卡
├── STAGE_TRACKER.md           # 阶段跟踪
├── UNIFIED_WORDING.md         # 统一口径
├── OPERATIONS_CONSOLE.md      # 操作控制台
├── LIVE_MEMORY_SURFACE.md     # 实时记忆面
├── DEFAULT_ACTION_CARD.md     # 默认动作卡
└── ...
```
