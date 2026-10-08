# pi-gangtieyizhi —— 钢铁意志 完整框架系统（外挂层）

> **这是 pi 底座的外挂系统「钢铁意志」的完整框架文件备份。**
> 一行命令即可外接到任何一台已装 pi 的机器上，让一个裸 pi 变强。

## 它是什么

pi-Agent 是底座，本身**没有任何记忆能力** —— 每开一个新会话就是一张白纸。
「钢铁意志」是架在它上面的一整套外挂：

- **记忆三层**：L1 原始日志 → L2 精炼 → L3 wiki 合成 + 向量检索
- **wiki 四类**：entities / concepts / sources / synthesis + playbooks 剧本库
- **22 个自研扩展**（`steel-will-*`）：wiki 引擎、自动触发、lint、temporal、self-status、
  成就动机、自主神经、auto-promoter、candidate-screener、clone-imprint、codegraph、
  forge、hallucination-eliminator、heartbeat、l1-logger、long-term、recall-tool、
  state-control、subconscious、transcendence、vector-radar
- **行为宪法**：阶梯规则、铁律、静默令、抓取决策阶梯、编码阶梯
- **技能库**：30+ 个 `steel-will-*` 技能 + browser-tools / edge-tts / github-get /
  hyperframes / pi-web-restart
- **自动运维**：L1 Watcher + 定时精炼 / 体检 / 备份

## 与另一个仓库的区别

| 仓库 | 装什么 | 谁能用 |
|---|---|---|
| **`pi-gangtieyizhi`**（本仓库） | **框架本体**：扩展、技能、引擎脚本、宪法、模板 | **可分发**。任何一台装了 pi 的机器都能外接，不含私人记忆与凭据 |
| `pi-xinxin` | **完整本体备份**：上面这些 **+ 记忆库 + 会话历史 + 凭据 + 服务定义** | 只用于我自己的整体复活 |

一句话：**这个仓库是「引擎」，那个仓库是「这台装了引擎的车」。**

## 一行外接（已实现）

```bash
git clone https://github.com/ip9988001/pi-gangtieyizhi.git ~/pi-gangtieyizhi && bash ~/pi-gangtieyizhi/attach.sh
```

- `bash attach.sh` —— 交互式，会询问 key（**全部可以跳过**）
- `bash attach.sh --yes` —— 全自动，key 从环境变量取
- `GLM_API_KEY=xxx bash attach.sh` —— 预先给 key

`attach.sh` 实际完成的 8 步：
1. 把 `extensions/` 装进 `~/.pi/agent/extensions/`
2. 把技能库装进 `~/.pi/agent/PI-技能库/` 与 `~/.agents/skills/`
3. 把 `AGENTS.md` 宪法、`SYSTEM.md` 装上
4. 注册 MCP 服务器与 settings 项
5. 初始化空的 `memory/` 目录骨架（L1 / wiki / candidates / system）
6. 装并启动 L1 Watcher

## 目录结构

```
pi-gangtieyizhi/
├── README.md              # 本文件
├── ATTACH 说明.md          # 外接与配置说明
├── KEYS.md                # 密钥清单与四级兜底规则
├── DEPENDENCIES.md        # 依赖总清单（哪些由 pi 自带、哪些要装）
├── attach.sh              # 一行外接脚本（8 步全自动）
├── extensions/            # 22 个启用的 steel-will-* 扩展
├── extensions-disabled/   # 15 个已停用扩展（保留可秒恢复）
├── skills/                # PI-技能库（33 个技能）
├── constitution/          # AGENTS.md / SYSTEM.md / 0-AGENTS / protocols（108 份协议文档）/ goals-template
├── engine/                # bin/（l1_watcher.py 等）services/ scripts/ aux/ pi-extensions/
├── config/                # settings / l1_watcher.config.example / mcp-adapter / package.json
├── memory-template/       # 空记忆骨架 + 协议文档
└── systemd/               # 服务与定时器单元
```

## 关键特性：零 key 也能跑

提炼引擎是**四级容灾链**：`GLM → GLM(关思考) → DeepSeek → pi 底座驱动模型`。

第四级调用 `pi -p`，**不需要任何外部 API key** —— 只要 pi 底座能跑，记忆提炼就能跑。
所以本框架在完全裸的机器上、一个 key 都不配的情况下，也能全功能正常运行。
