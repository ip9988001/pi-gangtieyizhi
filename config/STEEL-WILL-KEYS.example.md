# 钢铁意志外挂系统 · 密钥汇总表

> **本文件是钢铁意志外挂系统唯一的密钥来源。**
> 框架所有线路都从这里取值；这里没有的，自动降级到「pi 底座驱动模型」。
>
> 取值优先级：**环境变量 > 本文件 > `l1_watcher.config.json` > pi 底座驱动模型兜底**

## 一、自动区（由框架自动写入，**请勿手改**）

> 当第二区没有可用 key 时，框架会自动读取 pi 底座当前驱动模型的 key，
> 抄写到这里作为自己的兜底 key。pi 换了 provider/model/key，下次运行会自动刷新。

<!-- AUTO-START -->
```keys
driver_provider = deepseek
driver_model = deepseek-flash
driver_http_model = deepseek-chat
driver_base_url = https://api.deepseek.com/v1
driver_api_key = 
driver_key_type = api_key
auto_filled_at = 2026-10-08 23:57:09
```
<!-- AUTO-END -->

## 二、手工区（框架自有线路，按需填写）

> 两项都可以留空。留空即自动走下面第三区的兜底链。

```keys
glm_api_key =
glm_base_url = https://open.bigmodel.cn/api/paas/v4
glm_model = glm-4.7
deepseek_api_key =
deepseek_base_url = https://api.deepseek.com/v1
deepseek_model = deepseek-chat
```

## 三、兜底链（写在 `l1_watcher.py::call_llm_refine`）

```
① GLM（思考开）        ← 第二区 glm_api_key
② GLM（思考关）        ← 防推理吃光 max_tokens 导致正文为空
③ DeepSeek             ← 第二区 deepseek_api_key
④ pi 驱动模型密钥直连  ← 第一区 driver_api_key（框架自动从 pi 底座抄来）
⑤ pi 底座进程（pi -p） ← 终极兜底，连 pi 的 key 都不需要，只要 pi 能跑
```

**五级全部不需要人工配置 → 本文件整份留空也能跑。**

补充说明第四级：
- pi 里声明的模型名往往是别名（如 `deepseek-flash`），原厂 API 不认
- 框架会自动回退到 provider 标准名（`deepseek-chat`）试一次
- **成功后把可用名写回第一区的 `driver_http_model`**，下次一次到位（实测 0.9 秒）

## 四、pi 底座驱动模型的 key 存在哪（框架自动读取的来源）

| 文件 | 作用 | 结构 |
|---|---|---|
| `~/.pi/agent/settings.json` | 指定驱动模型 | `defaultProvider` / `defaultModel` |
| `~/.pi/agent/auth.json` | **存 provider 的 key**（pi 的 AuthStorage） | `{"<provider>": {"type":"api_key","key":"..."}}` |

框架读这两个文件，拿到「当前驱动模型 + 它的 key」，写进第一区。
**这是用户自己机器上的自己的 key，框架只是把它登记进来当自己的兜底线路。**

## 五、修改方式

```bash
# 改完保存即可，下次提炼自动生效
vi ~/.pi/agent/STEEL-WILL-KEYS.md
systemctl restart l1-watcher        # 采集侧立即生效

# 手动强制刷新第一区
python3 ~/.pi/agent/bin/l1_watcher.py --sync-key
```

---
*优先级：环境变量 > 本文件 > l1_watcher.config.json > pi 驱动模型*
