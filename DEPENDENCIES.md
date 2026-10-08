# 钢铁意志 · PI 版 —— 依赖总清单

> 核验日期 2026-10-08。`attach.sh` 按本表自动安装。

## 一、由 pi 底座自带（**不用装，不要装**）

pi 的托管安装会在 `~/.pi/agent/install/releases/<版本>/node_modules/` 里提供这些，
扩展直接 `import` 即可：

| 包 | 用途 | 谁在用 |
|---|---|---|
| `@earendil-works/pi-coding-agent` | **pi 扩展 SDK**（扩展的宿主 API） | 15 个扩展 import 它 |
| `typebox` | 工具参数 JSON Schema 定义 | 8 个扩展 |
| `jiti` | TS 运行时加载（`test-extensions.mjs` 用） | 引擎自检脚本 |
| Node.js 运行时 | 由 pi 托管安装在 `$XDG_DATA_HOME/pi-node/current/bin` | 全体 |

> 本机已核实：`install/releases/0.99.1/node_modules/` 下 `typebox`、`@earendil-works/pi-coding-agent`、`jiti` 均存在。
> **它们在 `~/.pi/agent/node_modules/` 里找不到是正常的**，不要重复安装。

## 二、框架自己声明的 npm 依赖（**必须装**）

写在 `config/package.json`，`attach.sh` 执行 `npm install` 即装：

| 包 | 版本 | 用途 |
|---|---|---|
| `@xenova/transformers` | `^2.17.2` | 本地向量化（语义检索） |
| `vectra` | `^0.15.0` | 本地向量库 |
| `pi-mcp-adapter` | `^2.10.0` | MCP 服务器适配（可选，要 MCP 才需要） |

**传递依赖**（由上面带出，需允许安装脚本）：`sharp@0.32.6`、`protobufjs@6/7/8`

```json
"allowScripts": { "sharp@0.32.6": true, "protobufjs@7.6.6": true, "protobufjs@6.11.6": true, "protobufjs@8.8.0": true }
```

## 三、Python 依赖

| 文件 | 第三方依赖 |
|---|---|
| `engine/bin/l1_watcher.py` | **纯标准库，零依赖** ✅ |
| `engine/scripts/refresh_skill_catalog.py` | 纯标准库 ✅ |
| `engine/scripts/voice-server.py` | 标准库 `socketserver` ✅ |
| `engine/aux/sync_daemon.py` | 纯标准库 ✅ |

**结论：引擎层不需要 pip 装任何东西。** 只有 Python 3.8+ 本身。
（可选：`pip install edge-tts` —— 语音技能用，非核心）

## 四、系统命令

**必需**：`node` `npm` `python3`(≥3.8) `bash` `systemctl`

**可选（缺了只是少个能力，不阻塞）**：
`git` `curl` `jq` `rsync` `socat` `nginx` `certbot`

## 五、按需的外部二进制（不属于框架，技能才用）

| 工具 | 谁需要 | 装法 |
|---|---|---|
| `rtk` | Shell 输出压缩 | GitHub release 单文件 → `/usr/local/bin` |
| `lean-ctx` | 上下文压缩 | `npm i -g lean-ctx-bin` |
| `lightpanda` | JS 执行引擎 | 官方 release |
| `scrapling` / `scrapling-mcp` | 网页抓取 MCP | `pip install "scrapling[all]"`（落在 `~/.local/bin`） |
| `agent-reach` | 13 平台内容获取 | 其仓库安装脚本 |
| `ast-grep` | 结构搜索 | `npm i -g @ast-grep/cli` |
| `playwright` | 浏览器自动化 | `pip install playwright && playwright install` |
| `tvly` / `yt-dlp` / `fd` / `jq` | 杂项 | pip / apt |

## 六、目录骨架（attach.sh 自动创建）

```
~/.pi/agent/
├── AGENTS.md              # 宪法（会备份原文件）
├── SYSTEM.md
├── 0-AGENTS/              # 技能目录 / 命令速查 / 写入规范
├── extensions/            # 22 个扩展
├── extensions-disabled/   # 15 个停用扩展
├── PI-技能库/             # 33 个技能
├── bin/                   # l1_watcher.py / recall.sh / pi-launcher
├── services/              # 语义检索服务
├── scripts/               # 向量化 / 技能目录刷新 / 语音
├── assets/registry.json
├── l1_watcher.config.json # key 配置（600）
└── memory/                # 记忆骨架
    ├── l1/  wiki/  wiki_candidates/pending/  agent/  candidates/
    ├── system/  goals/  stages/  reflections/  archive/protocols/
```
