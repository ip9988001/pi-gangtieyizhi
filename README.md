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

## 一行外接（规划中，尚未实现）

```bash
git clone https://github.com/ip9988001/pi-gangtieyizhi.git ~/pi-gangtieyizhi && bash ~/pi-gangtieyizhi/attach.sh
```

`attach.sh` 将完成：
1. 把 `extensions/` 装进 `~/.pi/agent/extensions/`
2. 把技能库装进 `~/.pi/agent/PI-技能库/` 与 `~/.agents/skills/`
3. 把 `AGENTS.md` 宪法、`SYSTEM.md` 装上
4. 注册 MCP 服务器与 settings 项
5. 初始化空的 `memory/` 目录骨架（L1 / wiki / candidates / system）
6. 装并启动 L1 Watcher

## 当前状态

**占位仓库** —— 仅本 README。框架内容待迁入。

## 规划目录结构

```
pi-gangtieyizhi/
├── README.md
├── attach.sh              # 一行外接脚本
├── extensions/            # 22 个启用的 steel-will-* 扩展
├── extensions-disabled/   # 15 个已停用扩展（保留可秒恢复）
├── skills/                # PI-技能库
├── agents-skills/         # 用户级技能
├── constitution/          # AGENTS.md / SYSTEM.md / 0-AGENTS
├── engine/                # bin/ services/ scripts/（L1 Watcher、向量化、检索）
├── memory-template/       # 空记忆骨架 + 目录约定
├── systemd/               # 服务与定时器单元
└── docs/                  # 框架说明与复原清单
```
