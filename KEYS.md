# 钢铁意志 · PI 版 —— 密钥清单与兜底规则

> 核验日期 2026-10-08。**本框架只需要 2 个外部 key，且两个都可以不填** —— 不填时自动降级到 pi 底座的驱动模型。

## 一、框架自己要的 key（只有 2 个）

| Key 名 | 用在哪 | 必填？ | 不填的后果 | 兜底链路 |
|---|---|---|---|---|
| `GLM_API_KEY` | `l1_watcher.py --refine-only`：每日 04:00 把 L1 碎片提炼成 L2/L3 记忆 | ❌ 可选 | 提炼质量下降 | → DeepSeek → **pi 底座驱动模型** |
| `DEEPSEEK_API_KEY` | 同上，第二级兜底 | ❌ 可选 | 少一条线路 | → **pi 底座驱动模型** |

## 一之二、密钥汇总表（**唯一密钥来源**）

`~/.pi/agent/STEEL-WILL-KEYS.md` —— 钢铁意志外挂系统所有 key/token 的登记处。
框架所有线路都从这里取值，**这里没有的才降级到 pi 驱动模型兜底**。

取值优先级：**环境变量 > 密钥汇总表 > `l1_watcher.config.json` > pi 驱动模型**

表分两区：

| 区 | 内容 | 谁写 |
|---|---|---|
| 第一区（自动区） | `driver_provider` / `driver_model` / `driver_http_model` / `driver_base_url` / `driver_api_key` / `auto_filled_at` | **框架自动写入，勿手改** |
| 第二区（手工区） | `glm_api_key` / `deepseek_api_key` 等自有线路 | 用户按需填写 |

### ★ 自动给自己配 key 的机制

当第二区两项都为空时，框架会：

1. 读 `~/.pi/agent/settings.json` 的 `defaultProvider` / `defaultModel`
2. 读 `~/.pi/agent/auth.json` 里**该 provider 的 key**（pi 的 AuthStorage）
3. 把它写进密钥汇总表**第一区**，作为钢铁意志自己的兜底 key
4. pi 换了 provider / model / key，下次运行自动刷新

这是用户自己机器上的自己的 key，框架只把它登记进来当自己的兜底线路。
手动强制刷新：`python3 ~/.pi/agent/bin/l1_watcher.py --sync-key`

## 一之三、提炼五级容灾链（写在 `call_llm_refine()` 里）

```
① GLM  glm-4.7（思考开）      ← 第二区 glm_api_key
② GLM  glm-4.7（思考关）      ← 防推理吃光 max_tokens 导致正文为空
③ DeepSeek                    ← 第二区 deepseek_api_key
④ pi 驱动模型密钥直连          ← 第一区 driver_api_key（自动从 pi 底座抄来）
⑤ pi 底座进程（pi -p）        ← 终极兜底，不需要任何 key
```

**④ 的实测数据**：pi 里声明的模型名是别名（`deepseek-flash`），原厂 API 不认，
框架会自动回退到 provider 标准名（`deepseek-chat`）并**把可用名记回第一区**，
下次一次到位。实测 **0.9 秒**返回。

**⑤ 的实现**：`pi -p -ne -ns -np --no-session`，用 pi 自身配置完成对话，实测 **1.3 秒**。

→ **五级全部无需人工配置：密钥汇总表整份留空，记忆提炼照样能跑。**

## 二、附带的配置项

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `GLM_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4` | 智谱网关 |
| `GLM_MODEL` | `glm-4.7` | 智谱模型 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com/v1` | DeepSeek 网关 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | DeepSeek 模型 |

**优先级**：环境变量 > `~/.pi/agent/l1_watcher.config.json` > 代码内默认值

## 三、key 会出现/读取的所有位置

| 位置 | 是什么 | 是否入库 |
|---|---|---|
| `~/.pi/agent/l1_watcher.config.json` | 框架的 key 配置（`glm_api_key` / `deepseek_api_key`） | ❌ **不入库**，用 `.example` 模板 |
| 环境变量 `GLM_API_KEY` / `DEEPSEEK_API_KEY` 等 6 个 | 最高优先级，不落盘 | —— |
| `~/.pi/agent/auth.json` | **pi 底座自己的** provider key（google / deepseek），框架不读写，只借道兜底 | ❌ 不入库 |

> ⚠️ 历史坑（已修）：`l1_watcher.py` 第 54 行**曾经把 GLM key 硬编码在源码里**当兜底默认值。
> 2026-10-08 已移除，改为第四级 pi 底座兜底。**现在源码里不含任何密钥。**

## 四、本仓库的脱敏约定

- `config/l1_watcher.config.example.json` —— key 字段留空，供 `attach.sh` 生成真实配置
- 真实 key **只存在**于运行机器的 `~/.pi/agent/l1_watcher.config.json`（权限 600）
- 完整凭据总账另见私有仓库 `pi-xinxin`

## 五、配置方式（三种任选）

```bash
# 方式一：attach.sh 交互式询问（推荐）
bash attach.sh

# 方式二：环境变量预先给
GLM_API_KEY=xxx DEEPSEEK_API_KEY=yyy bash attach.sh

# 方式三：装完手动改
vi ~/.pi/agent/l1_watcher.config.json
systemctl restart l1-watcher
```
