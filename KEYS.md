# 钢铁意志 · PI 版 —— 密钥清单与兜底规则

> 核验日期 2026-10-08。**本框架只需要 2 个外部 key，且两个都可以不填** —— 不填时自动降级到 pi 底座的驱动模型。

## 一、框架自己要的 key（只有 2 个）

| Key 名 | 用在哪 | 必填？ | 不填的后果 | 兜底链路 |
|---|---|---|---|---|
| `GLM_API_KEY` | `l1_watcher.py --refine-only`：每日 04:00 把 L1 碎片提炼成 L2/L3 记忆 | ❌ 可选 | 提炼质量下降 | → DeepSeek → **pi 底座驱动模型** |
| `DEEPSEEK_API_KEY` | 同上，第二级兜底 | ❌ 可选 | 少一条线路 | → **pi 底座驱动模型** |

**提炼四级容灾链（写在 `call_llm_refine()` 里）：**

```
① GLM  glm-4.7（思考开）   ← 要 GLM_API_KEY
② GLM  glm-4.7（思考关）   ← 防推理吃光 max_tokens 导致正文为空
③ DeepSeek                 ← 要 DEEPSEEK_API_KEY
④ pi 底座驱动模型（pi -p） ← 不需要任何 key！只要 pi 能跑
```

**④ 的实现**：调用 `pi -p "<prompt>"`（非交互模式），pi 用它 `settings.json` 里配好的
provider/model 完成这次对话。**已实测可用**（3.0 秒返回）。
→ 也就是说：**一个 key 都不配，记忆提炼照样能跑。**

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
