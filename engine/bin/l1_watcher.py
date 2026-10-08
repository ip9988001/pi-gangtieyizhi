#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
L1 Watcher V6 - 实时监控 + 每日 LLM 精炼引擎

功能:
  1. 启动时（每天一次）: 读 L1 文件 → ZhipuAI GLM-4.7 精炼 → 写 L3/Wiki
  2. 运行时: 200ms 事件循环监控 session JSONL → 自动写 L1
  3. 自动清理 >7 天旧 L1

精炼流程:
  - 读 lastRefinedDate
  - 收集日期 > lastRefined 且 < 今天 的 L1 文件
  - 拼接完整提示词 → 调智谱 GLM-4.7 流式输出
  - 解析 JSON → 写入 L3 长期记忆
  - 更新 lastRefinedDate
"""

import os, re, json, time, hashlib, argparse
from pathlib import Path
from datetime import datetime, timedelta
from os.path import basename
HOME = Path(os.environ.get("HOME", os.environ.get("USERPROFILE", "~")))
SESSIONS_DIR = HOME / ".pi" / "agent" / "sessions"
L1_DIR = HOME / ".pi" / "agent" / "memory" / "l1"
L3_DIR = HOME / ".pi" / "agent" / "memory" / "agent"
WIKI_DIR = HOME / ".pi" / "agent" / "memory" / "wiki"
SYSTEM_DIR = HOME / ".pi" / "agent" / "memory" / "system"
STATE_FILE = L1_DIR / ".watcher_state.json"
REFINER_STATE_FILE = SYSTEM_DIR / "refiner_state.json"

# 事件循环间隔
TICK = 0.2

# ============================================================
# LLM 配置：GLM 主线路 + DeepSeek 兜底
#   密钥优先级：环境变量 > 配置文件 > 内置默认
#   配置文件：~/.pi/agent/l1_watcher.config.json
# ============================================================
_CFG_FILE = HOME / ".pi" / "agent" / "l1_watcher.config.json"


def _load_cfg():
    try:
        if _CFG_FILE.exists():
            return json.loads(_CFG_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"  [配置] 读取 {_CFG_FILE} 失败: {e}")
    return {}


_CFG = _load_cfg()

GLM_API_KEY  = os.environ.get("GLM_API_KEY")  or _CFG.get("glm_api_key")  or ""
GLM_BASE_URL = os.environ.get("GLM_BASE_URL") or _CFG.get("glm_base_url") or "https://open.bigmodel.cn/api/paas/v4"
GLM_MODEL    = os.environ.get("GLM_MODEL")    or _CFG.get("glm_model")    or "glm-4.7"

DS_API_KEY   = os.environ.get("DEEPSEEK_API_KEY")   or _CFG.get("deepseek_api_key")   or ""
DS_BASE_URL  = os.environ.get("DEEPSEEK_BASE_URL")  or _CFG.get("deepseek_base_url")  or "https://api.deepseek.com/v1"
DS_MODEL     = os.environ.get("DEEPSEEK_MODEL")     or _CFG.get("deepseek_model")     or "deepseek-chat"

# ============================================================
# 精炼分批参数（依据 GLM-4.7 官方规格 + 本机实测）
#   官方：上下文窗口 200K tokens / 最大输出 128K tokens
#   实测：20,000 中文字符 -> 11,251 tokens，即 1.778 字符/token
#         35,142 字符输入 -> 4,924 字符输出（约 14:1）
# ============================================================
GLM_CONTEXT_TOKENS    = 200_000   # 官方上下文窗口
GLM_MAX_OUTPUT_TOKENS = 128_000   # 官方最大输出
CHARS_PER_TOKEN       = 1.778     # 实测中文语料换算比

REFINE_MAX_TOKENS     = 32_768    # 单批输出预算（原 8192：内容一长就会截断记忆清单 -> JSON 解析失败 -> 整批丢失）
REFINE_THINK_RESERVE  = 16_384    # 思考模式 reasoning 预留（实测 980~1,423，取十余倍余量）
REFINE_SAFETY_TOKENS  = 8_000     # 额外安全垫
REFINE_SYSTEM_RESERVE = 3_000     # 系统提示词占位（实测 4,145 字符 ~ 2,331 tokens）
REFINE_TAIL_MARGIN    = 1_000     # 每批尾部硬性留白，不贴着上限跑

# ---- 三轴取最小值，决定「单批原始内容」字符上限 ----
# (1) 上下文轴：(200000 - 3000系统 - 32768输出 - 16384思考 - 8000安全) x 1.778 ~ 248,650 字符
_cap_context = int((GLM_CONTEXT_TOKENS - REFINE_SYSTEM_RESERVE - REFINE_MAX_TOKENS
                    - REFINE_THINK_RESERVE - REFINE_SAFETY_TOKENS) * CHARS_PER_TOKEN)
# (2) 输出轴：按实测 14:1 比例，32,768 输出上限留 30% 后按 4 倍冗余反推 ~ 100,000 字符
_cap_output = 100_000
# (3) 延迟轴：实测 35,142 字符 ~ 76 秒，单批压在 5 分钟内 ~ 140,000 字符
_cap_latency = 140_000

REFINE_BATCH_CHARS = min(_cap_context, _cap_output, _cap_latency) - REFINE_TAIL_MARGIN

# 兼容旧变量名
ZHIPU_API_KEY = GLM_API_KEY
ZHIPU_MODEL = GLM_MODEL


def _llm_http(base_url, api_key, model, messages, max_tokens, temperature,
              timeout=600, thinking=None):
    """最小 OpenAI 兼容客户端（urllib，无第三方依赖）

    返回 (正文文本, finish_reason, 推理消耗tokens)
    """
    import urllib.request
    url = base_url.rstrip("/") + "/chat/completions"
    body = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }
    if thinking is not None:
        body["thinking"] = thinking
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {api_key}"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    choice = (data.get("choices") or [{}])[0]
    msg = choice.get("message") or {}
    content = msg.get("content") or ""
    if isinstance(content, list):  # 有些兼容接口把 content 返回成分段数组
        content = "".join(str(p.get("text", "")) for p in content if isinstance(p, dict))
    usage = data.get("usage") or {}
    reasoning_tokens = (usage.get("completion_tokens_details") or {}).get("reasoning_tokens", 0)
    return content, choice.get("finish_reason"), reasoning_tokens


def _strip_pi_noise(text):
    """剔掉 pi 底座启动时扩展打印的日志行，只留模型正文。"""
    keep = []
    for line in text.split("\n"):
        t = line.strip()
        if t.startswith(("[SteelWill", "[pi]", "[RTK", "[lean-ctx", "[LeanCtx", "extension loaded")):
            continue
        keep.append(line)
    return "\n".join(keep).strip()


def _llm_via_pi(messages, timeout=600, provider=None, model=None):
    """【第四级兜底】走 pi 底座自身的驱动模型，不需要任何外部 API key。

    原理：调用 `pi -p <prompt>`（非交互模式），pi 用它 settings.json 里
    配置好的 provider/model 直接完成一次对话。只要 pi 底座能跑，这条线就能跑。
    对应「没配 GLM key 就默认用 pi 的驱动模型兜底」的设计要求。
    """
    import subprocess, shutil
    exe = shutil.which("pi")
    if not exe:
        cand = HOME / ".pi" / "agent" / "bin" / "pi"
        exe = str(cand) if cand.exists() else None
    if not exe:
        raise RuntimeError("找不到 pi 可执行文件")

    sys_parts, body = [], []
    for m in messages:
        c = m.get("content") if isinstance(m, dict) else getattr(m, "content", "")
        if isinstance(c, list):
            c = "".join(str(x.get("text", "")) for x in c if isinstance(x, dict))
        r = m.get("role") if isinstance(m, dict) else getattr(m, "role", "user")
        (sys_parts if r == "system" else body).append(str(c))

    cmd = [exe, "-p", "\n\n".join(body)]
    if provider:
        cmd += ["--provider", provider]
    if model:
        cmd += ["--model", model]
    if sys_parts:
        cmd += ["--append-system-prompt", "\n\n".join(sys_parts)]

    env = dict(os.environ)
    env.setdefault("RTK_DISABLED", "1")
    r = subprocess.run(cmd, capture_output=True, text=True,
                       timeout=timeout, env=env, cwd=str(HOME))
    if r.returncode != 0:
        raise RuntimeError(f"pi 退出码 {r.returncode}: {(r.stderr or '')[:300]}")
    return _strip_pi_noise(r.stdout)


def call_llm_refine(messages, max_tokens=8192, temperature=0.6, label="精炼", timeout=600):
    """四级容灾链：
        ① GLM（思考开启，质量优先）
        ② GLM（思考关闭，防推理把 max_tokens 吃光导致正文为空）
        ③ DeepSeek
        ④ pi 底座自身驱动模型（pi -p，不需要任何外部 key）
    四级全失败返回空串。
    """
    errors = []

    if GLM_API_KEY:
        # 思考型模型（如 glm-4.7）开启思考会占用 completion 预算。
        # 实测：max_tokens=64 时推理吃掉 125 tokens，正文为空。
        # 因此若正文为空，关掉思考再试一次。
        for attempt, th in enumerate(({"type": "enabled"}, {"type": "disabled"}), 1):
            tag = "思考开" if attempt == 1 else "思考关"
            if attempt > 1:
                # 两次尝试别连着打：瞬时故障（网关抖动/限流）需要一点恢复时间，
                # 2026-10-01 实测两次连打均 HTTP 400，隔开重试可显著降低切兜底的概率。
                time.sleep(3)
            try:
                print(f"  [{label}] 主线路 GLM/{GLM_MODEL} 尝试{attempt}（{tag}）...")
                out, fin, rt = _llm_http(GLM_BASE_URL, GLM_API_KEY, GLM_MODEL, messages,
                                         max_tokens, temperature, timeout, thinking=th)
                if out.strip():
                    print(f"  [{label}] OK GLM 成功（正文 {len(out)} 字符 / 推理 {rt} tokens）")
                    return out
                errors.append(f"GLM尝试{attempt}空正文(finish={fin},推理{rt}tokens)")
                print(f"  [{label}] WARN GLM 返回空正文（finish_reason={fin}, 推理消耗 {rt} tokens）")
            except Exception as e:
                errors.append(f"GLM尝试{attempt} {type(e).__name__}: {e}")
                print(f"  [{label}] WARN GLM 尝试{attempt} 异常: {type(e).__name__}: {e}")
        print(f"  [{label}] 主线路两次尝试均失败，切换兜底线路")
    else:
        errors.append("GLM 未配置密钥")

    if DS_API_KEY:
        try:
            print(f"  [{label}] 兜底线路 DeepSeek ({DS_MODEL}) ...")
            out, fin, rt = _llm_http(DS_BASE_URL, DS_API_KEY, DS_MODEL, messages,
                                     max_tokens, temperature, timeout)
            if out.strip():
                print(f"  [{label}] OK DeepSeek 兜底成功（{len(out)} 字符）")
                return out
            errors.append(f"DeepSeek 返回空内容(finish={fin})")
        except Exception as e:
            errors.append(f"DeepSeek {type(e).__name__}: {e}")
    else:
        errors.append("DeepSeek 未配置密钥（兜底不可用）")

    # ---- 第四级：pi 底座自身驱动模型（无需任何外部 key）----
    try:
        print(f"  [{label}] 终极兜底 pi 底座驱动模型（pi -p）...")
        out = _llm_via_pi(messages, timeout=timeout)
        if out.strip():
            print(f"  [{label}] OK pi 底座兜底成功（{len(out)} 字符）")
            return out
        errors.append("pi 底座返回空内容")
    except Exception as e:
        errors.append(f"pi 底座 {type(e).__name__}: {e}")
        print(f"  [{label}] WARN pi 底座兜底失败: {type(e).__name__}: {e}")

    print(f"  [{label}] FAIL 四级线路均失败: {'; '.join(errors)}")
    return ""


# ---- 兼容皮：形状与 zai-sdk 的 client.chat.completions.create 一致 ----
class _LLMDelta:
    def __init__(self, content):
        self.content = content
        self.reasoning_content = None


class _LLMMessage:
    def __init__(self, content):
        self.content = content


class _LLMChoice:
    def __init__(self, content):
        self.delta = _LLMDelta(content)
        self.message = _LLMMessage(content)


class _LLMResponse:
    def __init__(self, text):
        self._text = text
        self.choices = [_LLMChoice(text)]

    def __iter__(self):
        # 流式调用点会 for chunk in response；这里一次性给出全文
        yield self


class ZhipuAiClient:
    """内部实际走 GLM→DeepSeek 双线路容灾，接口与原 zai-sdk 兼容。"""

    def __init__(self, api_key=None):
        self.chat = self
        self.completions = self

    def create(self, model=None, messages=None, **_kw):
        text = call_llm_refine(
            messages or [],
            max_tokens=_kw.get("max_tokens", 4096),
            temperature=_kw.get("temperature", 0.6),
        )
        return _LLMResponse(text)

# 信号词（用于实时监控写入 L1）
SIGNALS = {
    "preference": [r"偏好", r"喜欢用?", r"习惯", r"总是", r"以后都", r"默认用?", r"首选", r"倾向"],
    "lesson":    [r"教训", r"永远不要", r"不要", r"禁止", r"千万别", r"踩坑", r"失败", r"错误", r"避免", r"不该", r"不能"],
    "pattern":   [r"模式", r"套路", r"流程", r"方案", r"做法", r"步骤", r"方法", r"策略", r"规律"],
    "decision":  [r"决定", r"结论", r"选择", r"确认", r"定下来", r"就这样", r"敲定", r"最终", r"确定了"],
    "fact":      [r"记住", r"记下来", r"重要", r"关键", r"核心", r"基础", r"原理", r"本质", r"必须"],
}
LABELS = {"preference": "偏好", "lesson": "教训", "pattern": "模式", "decision": "决策", "fact": "事实"}

# 防抖
DEBOUNCE_SEC = 1.5
_last_process_time = {}

# L3 类型 → 目录映射
L3_TYPE_DIR = {
    "lesson": "lessons",
    "preference": "decisions",
    "pattern": "patterns",
    "decision": "decisions",
    "fact": "cases",
}

# ============================================================
# LLM 精炼提示词
# ============================================================

REFINER_SYSTEM_PROMPT = """你叫"钢铁意志·记忆精炼引擎"，你的唯一任务是将原始对话日志提炼为结构化长期记忆。

一、你的身份与使命

你是钢铁意志记忆系统的核心处理单元。你的上游是 L1 碎片层（用户与 AI 助手的完整对话日志，含语气词、闲聊、代码块、讨论过程等大量噪音），你的下游是 L3 长期记忆层和 Wiki 结构化知识层。

你的输出将直接写入用户的永久记忆库，被后续的 recall_memory 检索使用，质量直接影响整个记忆系统的好坏。

你必须做到：
  - 从噪音中提取信号：上百万字的对话日志里，真正值得记住的可能只有几十条
  - 宁可漏掉，不要污染：一条垃圾记忆比漏掉十条好记忆的危害更大
  - 每一条输出都经得起时间考验：半年后读到这条记忆，仍然有用

二、输入格式

你会收到完整的 L1 对话日志，原始格式包含：
  - Q: 用户的提问
  - A: AI 助手的回答
  - 中间可能夹杂代码块、表格、技术细节、情绪表达
  - 一个文件可能包含几十轮对话，跨越数小时

你的任务是从这堆原始对话中找出一切值得长期保留的内容。

三、五类记忆的详细定义与判断标准

【类型一：lesson — 教训与反模式】

定义：从错误、失败、踩坑中得出的"不应该做什么"或"应该做什么"。
这些是记忆系统中最有价值的类型，因为它们直接防止未来重蹈覆辙。

判断标准（必须全部满足）：
  1. 有明确的错误行为描述（谁做了什么）
  2. 有后果或影响（导致了什么问题）
  3. 有可操作的避坑指南（应该怎么做才对）

合格示例：
  ✅ "AGENTS.md 中回退协议与主指令平级排列，导致 AI 默认选择更详细的回退路径而跳过 recall_memory Step 1——回退是保险丝不是主线路，已将回退协议降级为折叠块"
  ✅ "不应在未实际调用工具函数时就断言其不可用——必须先调用再判断，避免假阴性判定"
  ✅ "bat 文件中文字符 + 引号嵌套会导致 cmd.exe 编码错误，应用纯英文标题或避免嵌套引号"

不合格示例：
  ❌ "今天犯了个错"——太笼统，无具体行为，无法复用
  ❌ "ts 有个 bug"——太泛化，没有说明是什么 bug 和怎么避免
  ❌ "部署失败了"——没有原因和解决方案

severity 判定：
  - high：影响系统核心行为、安全、数据完整性
  - medium：影响开发效率、代码质量
  - low：次要的注意事项

【类型二：preference — 用户偏好与习惯】

定义：用户明确表达或通过反复行为体现的技术选型、工具偏好、工作习惯。
这类记忆帮助 AI 在后续对话中自动适配用户风格。

判断标准（严格）：
  1. 必须是用户自己明确说过的。关键词："我喜欢"、"默认用"、"以后都"、"首选"、"习惯"、"偏好"
  2. 不能是 AI 从行为中推测的——推测不记
  3. 单次提到的标记 severity=low，跨会话反复出现的标记 severity=high

合格示例：
  ✅ "用户默认使用 DeepSeek V4 Pro 作为主模型，思考级别 high，Shell 环境为 Git Bash"
  ✅ "用户要求在每次 PI 启动时自动提炼 L1 记忆，同一天不重复执行"
  ✅ "用户偏好用 Python 而非 TypeScript 做后台脚本"

不合格示例：
  ❌ "用户今天问了很多技术问题"——不是偏好
  ❌ "用户可能喜欢 Linux"——推测，不是用户说的
  ❌ "用户用了 rm 命令"——行为快照，不是偏好

【类型三：pattern — 可复用的流程与模式】

定义：经过讨论和验证的、有明确步骤的操作方法、设计模式、工作流程。
这类记忆是"怎么做"的知识库。

判断标准：
  1. 有没有明确的步骤或阶段？
  2. 能不能被其他相似场景复用？
  3. 是不是总结性的、提炼过的，而不是原始执行记录？

合格示例：
  ✅ "钢铁意志行为链（同轮完成）：①同轮判定任务类型（纯讨论直接答）②需要时 recall_memory 查剧本/记忆 ③动手型走剧本库→工具索引 ④执行任务 ⑤信号检测(wiki_capture_candidate)｜两条铁律：禁止无 recall 引用历史、禁止无 recall 断言没有记忆"
  ✅ "L1 提炼采用增量模式：启动时读状态文件获取 lastRefinedDate，只提炼日期 > lastRefined 且 < 今天的 L1 文件，提炼完成后更新 lastRefined，>7天旧文件删除"
  ✅ "GitHub 项目分析流程：github-get skill → clone → 分析代码结构 → 生成报告 → 写入 L1 → 用户确认"

不合格示例：
  ❌ "改了一个文件"——无步骤，无复用价值
  ❌ "今天讨论了方案"——太模糊，没有具体内容
  ❌ "执行了 npm install"——单次操作，不是模式

【类型四：decision — 已做出的决定与结论】

定义：经过讨论后明确敲定的技术决策、架构选择、方向性定案。
这类记忆记录"我们选择了什么路"，防止未来反复讨论已决定的事。

判断标准：
  1. 是否是讨论后的最终结论？中间过程的讨论不记
  2. 是否有敲定的信号词？"就这样"、"确定了"、"最终方案"、"敲定"、"定下来"
  3. 是否会影响后续的架构或行为？

合格示例：
  ✅ "晋升管道架构定为纯 LLM 驱动：去掉规则引擎中间层，L1 原始日志直接喂给 LLM 提炼为结构化记忆"
  ✅ "AGENTS.md Step 1 重构方案：回退协议从 section heading 降级为 HTML <details> 折叠块，主指令前加 🚨 最高优先级标记"
  ✅ "L1 提炼时机：每天 PI 启动时执行一次，同一天多次启动不重复，状态用 lastRefinedDate 持久化"

不合格示例：
  ❌ "可以考虑方案A或B"——未敲定
  ❌ "我们先试试方案C"——试验阶段，不是最终
  ❌ "你觉得呢"——还在讨论

【类型五：fact — 需要记住的事实与知识点】

定义：重要的客观信息、系统架构、配置参数、关键数据、概念定义。
这类记忆是"是什么"的知识库。

判断标准：
  1. 是否是一个确定的客观事实（不是观点或猜测）？
  2. 未来会话中是否可能被问到或需要查阅？
  3. 如果丢失，是否需要重新搜索或询问才能恢复？

合格示例：
  ✅ "钢铁意志记忆系统为四层递进架构：L1 碎片层(每日对话日志) → L2 候选池(信号提取) → L3 长期记忆(闸门验证后晋升) → Wiki 结构化知识(同主题合成)"
  ✅ "PI 扩展 API(ExtensionAPI)不提供直接调用 LLM 的方法，不能在扩展内实现 LLM 驱动的记忆提炼"
  ✅ "L1 目录路径：~/.pi/agent/memory/l1/，每日一个 YYYY-MM-DD.md 文件，由 l1_watcher.py 从 session JSONL 自动写入"

不合格示例：
  ❌ "今天天气很好"——无关信息
  ❌ "刚才用户说了一句话"——无长期价值
  ❌ "temperature=0.7"——孤立参数，无上下文

四、核心处理规则（必须遵守）

【规则1：去噪优先】
必须删除的内容：
  - 所有问候语和客套话："你好"、"在吗"、"OK"、"好的"、"明白了"
  - 所有确认和过渡词："对"、"是的"、"懂了"、"嗯"、"那么"、"然后呢"、"继续说"
  - 所有 Markdown 格式符号：##、**、```、---、表格边框
  - 所有纯代码片段（除非代码本身是教训或模式的一部分）
  - 所有重复内容：多条对话反复讨论同一件事 → 合并为一条，取最精炼版本

【规则2：精炼标准】
每条输出必须满足：
  - 长度 15-80 字，中文为主，技术术语可用英文
  - 主语明确，不依赖上下文就能独立理解
  - 一句话说清核心信息，不要啰嗦
  - 不要使用"用户问了一个关于...的问题"这种元描述——直接说内容

【规则3：质量阈值】
以下情况直接丢弃，不输出：
  - 信息量不足：碎片太短或太模糊，无法形成有意义的记忆
  - 纯技术操作细节：改了一行代码、修了一个小 bug（除非背后有通用教训）
  - 单次偶发事件：只出现一次且无长期价值
  - 纯情绪或牢骚：没有实质内容的情绪表达

例外：如果用户在讨论中明确说"记住这个"、"把这个记下来"、"这个很重要"——
即使不符合上述标准，也必须保留，标记 severity=high。

【规则4：关联标记】
related 字段填关联主题，用于未来的交叉检索。格式为简洁的主题标签。
例如：["记忆系统架构", "晋升管道", "AGENTS.md"]

五、输出格式（严格约束）

必须严格输出 JSON 数组，不要用 Markdown 代码块包裹（不要 ```json），不要任何解释文字：

[
  {
    "type": "lesson",
    "content": "精炼后的记忆内容",
    "keywords": ["关键词1", "关键词2"],
    "severity": "high",
    "related": ["关联主题1"]
  }
]

如果没有任何值得保留的内容，输出空数组：[]

六、最终提醒

1. 质量 > 数量。输出 3 条高质量记忆远好于 30 条垃圾。
2. 如果你不确定某条碎片是否值得保留，倾向于丢弃。
3. 如果整篇输入都是技术调试细节没有可提炼的洞察，输出 []。
4. 只输出 JSON 数组，不要任何额外文字。"""


SYNTHESIS_PROMPT = """你是钢铁意志Wiki合成引擎。将多条同一主题的L3记忆合成为一篇结构化Wiki页面。

输入：一个主题标签和3-10条同一主题的L3记忆条目（每条包含类型、内容、关键词、严重度）。

你的输出必须是完整的Markdown文档，严格按以下结构：

# 页面标题

> 一句话概述这个主题

## 概述
2-3句话说明这个主题是什么、为什么重要、涵盖哪些方面。

## 核心内容
按逻辑分2-4段，每段一个小标题。从L3记忆中提取关键信息，用自己的话重新组织。不要逐条罗列，要融会贯通。严重度high的内容优先展开，low的一笔带过。

## 关键要点
- 要点1
- 要点2
- 要点3

## 相关主题
- [[关联页面标题1]]
- [[关联页面标题2]]

## Metadata
- 来源: L3记忆自动合成
- 合成日期: (我会填入)
- 条目数: (我会填入)

Wiki页面分四类，你在标题上方用一行标注类别：
- entities（实体）：具体的系统、工具、配置、项目。判断标准：是一个可指认的"东西"
- concepts（概念）：抽象原理、设计思想、架构理念。判断标准：是一个可解释的"思想"
- sources（来源）：外部参考、API文档、配置来源。判断标准：信息的"出处"
- synthesis（综合）：跨主题的总结、对比、决策记录。判断标准：多个概念交叉的"总结"

合成规则：
1. 融会贯通，不要逐条罗列L3条目，理解它们之间的关系后重新组织
2. 去重，多条L3说同一件事只写一次
3. 如果L3记忆之间有矛盾，标注"注意：存在不同观点"并简述各方
4. 200-600字，精炼不啰嗦，中文为主
5. 不要出现"用户说""AI回复""根据L3条目"等元描述，Wiki是知识不是对话记录
6. 直接输出Markdown正文，不要JSON包裹，不要代码块包裹，不要任何解释文字"""


# ============================================================
# 文字提取工具
# ============================================================

def get_text(msg):
    inner = msg.get("message", {}) if isinstance(msg.get("message"), dict) else {}
    content = msg.get("content") or inner.get("content", [])
    if isinstance(content, str):
        return content
    texts = []
    for b in (content if isinstance(content, list) else []):
        if isinstance(b, dict):
            t = b.get("text", "")
            if t: texts.append(t)
        elif isinstance(b, str):
            texts.append(b)
    return " ".join(texts)


def get_role(msg):
    inner = msg.get("message", {}) if isinstance(msg.get("message"), dict) else {}
    return msg.get("role", inner.get("role", ""))


def short(text, n=300):
    text = re.sub(r"\s+", " ", text).strip()
    return (text[:n-3] + "...") if len(text) > n else text


# ============================================================
# 实时监控 (JSONL → L1)
# ============================================================

# 桥注入的提示词特征。这些内容由 Telegram / 企微 桥通过 --append-system-prompt 注入，
# pi 会把它们落盘成 role=user 的 message 条目，但它们并非用户输入。
# 不过滤的话：① 每轮对话都被当成「用户说的话」写进 L1；② 命中信号词时产生假条目。
INJECTED_PROMPT_MARKERS = (
    "【性能约定】",
    "【上一段会话的接续摘要】",
    "当前为 Telegram 轻量模式",
    "当前为企业微信轻量模式",
    "按宪法只执行 Step 1",
    "你正在为「下一段会话」写接续摘要",
)


def is_injected_prompt(text):
    """判断一条 role=user 的消息是否其实是桥注入的系统提示。"""
    t = (text or "").lstrip()
    if not t:
        return False
    return any(t.startswith(m) for m in INJECTED_PROMPT_MARKERS)


def process(fp, state):
    fkey = str(fp)
    pos = state.get("pos", {}).get(fkey, 0)
    last_ts = state.get("ts", {}).get(fkey, "1970-01-01T00:00:00Z")
    msgs = []
    has_user = False
    ts_now = datetime.now().strftime("%H:%M:%S")

    try:
        with open(fp, "r", encoding="utf-8", errors="replace") as f:
            if pos > 0:
                try: f.seek(pos)
                except: pos = 0
            read_start_pos = f.tell()  # 记录开始位置
            for line in f:
                line = line.strip()
                if not line: continue
                try: obj = json.loads(line)
                except: continue
                if obj.get("type") != "message": continue
                if str(obj.get("timestamp", "")) <= last_ts: continue
                if get_role(obj) == "user" and is_injected_prompt(get_text(obj)):
                    # 桥注入的提示词 —— 不是用户说的话，跳过，避免污染 L1 与假信号
                    continue
                msgs.append(obj)
                if get_role(obj) == "user":
                    has_user = True
                    # 用开始位置作为 user 消息的近似位置
                    state.setdefault("last_user_pos", {})[fkey] = max(0, read_start_pos)
            state.setdefault("pos", {})[fkey] = f.tell()
    except Exception as _e:
        print(f"  [{ts_now}] [错误] 读取失败: {_e}")
        return 0

    if not msgs:
        return 0

    user_status = "Y" if has_user else "N"
    print(f"  [{ts_now}] [处理] {fp.name[:45]} msgs={len(msgs)} has_user={user_status}")

    # 如果新消息中没有 user（只有 assistant/toolResult），回读最后一条 user 消息
    if not has_user and pos > 0:
        last_user_pos = state.get("last_user_pos", {}).get(fkey, 0)
        print(f"  [{ts_now}] [回读] last_user_pos={last_user_pos}")
        if last_user_pos > 0:
            try:
                with open(fp, "r", encoding="utf-8", errors="replace") as f:
                    f.seek(last_user_pos)
                    for line in f:
                        line = line.strip()
                        if not line: continue
                        try: obj = json.loads(line)
                        except: continue
                        if obj.get("type") != "message": continue
                        if get_role(obj) == "user":
                            msgs.insert(0, obj)
                            print(f"  [{ts_now}] [回读] 找到 user 消息")
                            break
            except Exception as e:
                print(f"  [{ts_now}] [回读失败] {e}")

    turns, cur = [], []
    for m in msgs:
        r = get_role(m)
        if r == "user" and cur:
            turns.append(cur); cur = []
        cur.append(m)
    if cur: turns.append(cur)

    state.setdefault("ts", {})[fkey] = str(msgs[-1].get("timestamp", ""))

    turn_data = []
    for grp in turns:
        qt, at = [], []
        for m in grp:
            r = get_role(m); t = get_text(m)
            if not t.strip(): continue
            if r == "user":
                if not is_injected_prompt(t):
                    qt.append(t)
            elif r == "assistant":
                inner = m.get("message", {}) if isinstance(m.get("message"), dict) else {}
                c = m.get("content") or inner.get("content", [])
                for b in (c if isinstance(c, list) else []):
                    if isinstance(b, dict) and b.get("type") == "text":
                        at.append(b.get("text", ""))
        if qt:
            turn_data.append({
                "user": short(" ".join(qt), 300),
                "assistant": short(" ".join(at), 300) if at else "",
            })

    signal_facts = []
    for td in turn_data:
        combined = td["user"] + " " + td["assistant"]
        for cat, pats in SIGNALS.items():
            for pat in pats:
                m = re.search(pat, combined)
                if m:
                    for s in re.split(r"[.!?;\n]", combined):
                        s = s.strip()
                        if re.search(pat, s) and len(s) > 5:
                            signal_facts.append((cat, short(s, 400), pat))
                            break
                    break

    today = datetime.now().strftime("%Y-%m-%d")
    l1 = L1_DIR / f"{today}.md"
    L1_DIR.mkdir(parents=True, exist_ok=True)
    if not l1.exists():
        l1.write_text(f"# {today}\n\n", encoding="utf-8")

    state.setdefault("known", {})
    state.setdefault("recent_q", {})
    # 清理非今日的近期去重记录，避免无限增长
    for _k in [k for k, v in list(state["recent_q"].items()) if v != today]:
        state["recent_q"].pop(_k, None)
    written = 0; now_str = datetime.now().strftime("%H:%M"); parts = []

    if turn_data:
        # 去重：同一句 Q 只进 recent 一次。
        # 不去重的话，「回读最后一条 user」机制会在每轮工具调用后把同一句 Q 重写一次
        # （实测同一句话被写了 6 遍，L1 膨胀到 2200+ 行）。
        fresh = []
        for td in turn_data[-5:]:
            qh = hashlib.sha256(td["user"][:200].encode()).hexdigest()[:16]
            if qh in state["recent_q"]:
                continue
            if not td["assistant"]:
                continue          # 还没有助手回复 —— 先不写也不记账，等下一轮带上 A 再写
            state["recent_q"][qh] = today
            fresh.append(td)
        if fresh:
            parts.append(f"\n## [{now_str}] recent\n\n")
            for td in fresh:
                parts.append(f"- Q: {td['user']}\n")
                parts.append(f"  A: {td['assistant']}\n")
            parts.append("\n"); written += 1

    for cat, text, trigger in signal_facts:
        h = hashlib.sha256(text[:100].encode()).hexdigest()[:16]
        if h in state["known"]: continue
        if any(text[:40] in v.get("t", "")[:40] for v in state["known"].values()): continue
        state["known"][h] = {"t": text, "c": cat, "d": today}
        label = LABELS.get(cat, cat)
        parts.append(f"\n## [{now_str}] [{label}] {trigger}\n\n{text}\n")
        written += 1

    part_status = "Y" if parts else "N"
    print(f"  [{ts_now}] [结果] turn_data={len(turn_data)} signal={len(signal_facts)} parts={part_status}")

    if parts:
        try:
            with open(l1, "a", encoding="utf-8") as f:
                f.write("".join(parts))
            print(f"  [{ts_now}] [写入] L1 {l1.name} +{written}条")
        except Exception as e:
            print(f"  [{ts_now}] [写入失败] {e}")
            return 0
    return written


def load_state():
    if STATE_FILE.exists():
        try: return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except: pass
    return {}


def save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


# ============================================================
# 每日 LLM 精炼引擎
# ============================================================

def load_refiner_state():
    try:
        if REFINER_STATE_FILE.exists():
            return json.loads(REFINER_STATE_FILE.read_text(encoding="utf-8"))
    except: pass
    return {"lastRefinedDate": ""}


def save_refiner_state(state):
    SYSTEM_DIR.mkdir(parents=True, exist_ok=True)
    REFINER_STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def get_l1_files_to_refine(last_refined_date):
    """获取需要精炼的 L1 文件: 日期 > lastRefined 且 < 今天"""
    today = datetime.now().strftime("%Y-%m-%d")
    if not L1_DIR.exists():
        return []

    files_to_refine = []
    for fp in sorted(L1_DIR.glob("*.md")):
        name = fp.stem
        # 提取日期: YYYY-MM-DD 或 YYYY-MM-DD-xxx
        match = re.match(r"^(\d{4}-\d{2}-\d{2})", name)
        if not match:
            continue
        file_date = match.group(1)

        if file_date > last_refined_date and file_date < today:
            files_to_refine.append(fp)

    return files_to_refine


def split_into_batches(text, max_chars=None):
    """把超长文本按「行边界」切成多批，每批 <= max_chars。

    切点优先落在空行 / 标题 / 单条消息边界上（L1 里每条记录是独立一行），
    避免把一句话从中间劈开。只有单行本身超限时才退化为硬切。
    返回批次列表；不超限时返回单元素列表（保持原行为）。
    """
    if max_chars is None:
        max_chars = REFINE_BATCH_CHARS
    if len(text) <= max_chars:
        return [text]

    batches, buf, buf_len = [], [], 0

    def flush():
        nonlocal buf, buf_len
        if buf:
            seg = "\n".join(buf).strip()
            if seg:
                batches.append(seg)
            buf, buf_len = [], 0

    for line in text.split("\n"):
        line_len = len(line) + 1
        if line_len > max_chars:            # 极端情况：单行就超限，只能硬切
            flush()
            for i in range(0, len(line), max_chars):
                batches.append(line[i:i + max_chars])
            continue
        if buf_len + line_len > max_chars:  # 这批装不下了，另起一批
            flush()
        buf.append(line)
        buf_len += line_len
    flush()
    return batches


def call_zhipu_refine(l1_content, file_dates):
    """精炼单批 L1 内容，返回结构化记忆列表。

    返回值约定：
      list  -> 成功（可能是空列表，代表本批确实没有值得提炼的内容）
      None  -> 整批失败（API 异常 / 空输出 / JSON 解析失败），调用方不要推进游标
    """
    client = ZhipuAiClient(api_key=GLM_API_KEY)

    date_range = file_dates[0] if len(file_dates) == 1 else f"{file_dates[0]} ~ {file_dates[-1]}"
    print(f"  [精炼] 待处理日期: {date_range} ({len(file_dates)} 天)")
    print(f"  [精炼] 内容长度: {len(l1_content)} 字符")
    print(f"  [精炼] 调用 GLM-4.7 (流式)...")

    # 硬护栏：正常路径下调用方已按 REFINE_BATCH_CHARS 分批。
    # 走到这里说明上游漏批 —— 大声告警后再截断，绝不静默丢数据。
    if len(l1_content) > REFINE_BATCH_CHARS:
        print(f"  [精炼] ⚠️ 单批 {len(l1_content)} 字符 > 上限 {REFINE_BATCH_CHARS}，"
              f"上游未分批，强制截断 {len(l1_content) - REFINE_BATCH_CHARS} 字符！")
        l1_content = l1_content[:REFINE_BATCH_CHARS] + "\n\n[内容过长，已截断]"
    else:
        _room = REFINE_BATCH_CHARS - len(l1_content)
        print(f"  [精炼] 本批余量: {_room} 字符（上限 {REFINE_BATCH_CHARS}）")

    user_message = f"以下是从 {date_range} 的 L1 对话日志中提取的内容，请严格按系统提示词要求提炼：\n\n{l1_content}"

    try:
        response = client.chat.completions.create(
            model=ZHIPU_MODEL,
            messages=[
                {"role": "system", "content": REFINER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            thinking={"type": "enabled"},
            stream=True,
            max_tokens=REFINE_MAX_TOKENS,
            temperature=0.6,
        )

        full_output = ""
        for chunk in response:
            delta = chunk.choices[0].delta
            if delta.reasoning_content:
                # 思考过程（不显示）
                pass
            if delta.content:
                full_output += delta.content
                # 流式输出到终端（限长）
                if len(full_output) % 200 < 10:
                    print(".", end="", flush=True)

        print()  # 换行

        if not full_output.strip():
            print("  [精炼] 模型返回空内容 -> 判定为整批失败")
            return None

        # 尝试解析 JSON
        full_output = full_output.strip()
        # 去除可能的 Markdown 代码块包裹
        if full_output.startswith("```"):
            lines = full_output.split("\n")
            lines = lines[1:] if lines[0].startswith("```") else lines
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            full_output = "\n".join(lines)

        try:
            result = json.loads(full_output)
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            # 尝试提取 JSON 数组
            match = re.search(r"\[.*\]", full_output, re.DOTALL)
            if match:
                try:
                    result = json.loads(match.group(0))
                    if isinstance(result, list):
                        return result
                except:
                    pass

        print(f"  [精炼] JSON 解析失败，原始输出前200字: {full_output[:200]}")
        return None

    except Exception as e:
        print(f"  [精炼] API 调用失败: {e}")
        return None


def write_refined_memories(memories):
    """将精炼后的记忆写入 L3 目录"""
    written = 0
    today = datetime.now().strftime("%Y-%m-%d")

    for mem in memories:
        mem_type = mem.get("type", "fact")
        content = mem.get("content", "")
        keywords = mem.get("keywords", [])
        severity = mem.get("severity", "medium")
        related = mem.get("related", [])

        if not content or len(content) < 10:
            continue

        # 确定目标目录
        dir_name = L3_TYPE_DIR.get(mem_type, "cases")
        target_dir = L3_DIR / dir_name
        target_dir.mkdir(parents=True, exist_ok=True)

        # 生成文件名
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:12]
        file_name = f"{today}-{mem_type}-{content_hash}.md"
        file_path = target_dir / file_name

        # 去重
        if file_path.exists():
            continue

        # 写 L3 文件
        kw_str = ", ".join(keywords)
        rel_str = ", ".join(related)
        l3_content = f"""# {content[:80]}

## 元数据
- **类型**: {mem_type}
- **严重度**: {severity}
- **关键词**: {kw_str}
- **关联主题**: {rel_str}
- **来源**: L1 日志 LLM 精炼
- **精炼日期**: {today}
- **状态**: active

## 内容
{content}

## 关键词
{chr(10).join(f'- {k}' for k in keywords)}

## 关联
{chr(10).join(f'- {r}' for r in related)}
"""
        file_path.write_text(l3_content, encoding="utf-8")
        written += 1

    return written


def cluster_l3_by_topic():
    clusters = {}
    for dir_name in L3_TYPE_DIR.values():
        d = L3_DIR / dir_name
        if not d.exists():
            continue
        for fp in d.glob("*.md"):
            try:
                content = fp.read_text(encoding="utf-8")
                related_match = re.search(r'关联主题[*:：]+\s*(.+)', content)
                if not related_match:
                    continue
                related = [r.strip() for r in related_match.group(1).split(",")]
                for topic in related:
                    if topic not in clusters:
                        clusters[topic] = []
                    clusters[topic].append(fp)
            except:
                pass
    return {k: v for k, v in clusters.items() if len(v) >= 3}


def synthesize_to_wiki(state):
    clusters = cluster_l3_by_topic()
    if not clusters:
        print(f"  [合成] 没有达到3条的主题，跳过")
        return 0
    print(f"  [合成] 发现 {len(clusters)} 个可合成主题")
    synthesized = state.get("synthesized_topics", [])
    new_clusters = {k: v for k, v in clusters.items() if k not in synthesized}
    if not new_clusters:
        print(f"  [合成] 所有主题已合成过，跳过")
        return 0
    client = ZhipuAiClient(api_key=GLM_API_KEY)
    total = 0
    today = datetime.now().strftime("%Y-%m-%d")
    for topic, files in list(new_clusters.items())[:3]:
        print(f"  [合成] {topic} ({len(files)}条)")
        entries = []
        for fp in files:
            try:
                c = fp.read_text(encoding="utf-8")
                tm = re.search(r'类型[:：]\s*(\S+)', c)
                cm = re.search(r'## 内容\n(.+)', c)
                sm = re.search(r'严重度[:：]\s*(\S+)', c)
                et = tm.group(1) if tm else "fact"
                ec = cm.group(1).strip()[:300] if cm else c[:300]
                es = sm.group(1) if sm else "medium"
                entries.append(f"[{et}|{es}] {ec}")
            except:
                pass
        if len(entries) < 3:
            continue
        user_msg = f"主题: {topic}\n\nL3条目:\n" + "\n".join(f"- {e}" for e in entries)
        try:
            response = client.chat.completions.create(
                model=ZHIPU_MODEL,
                messages=[
                    {"role": "system", "content": SYNTHESIS_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                thinking={"type": "enabled"},
                max_tokens=4096,
                temperature=0.6,
            )
            md = response.choices[0].message.content
        except Exception as e:
            print(f"  [合成] API: {e}")
            continue
        if not md or len(md) < 50:
            continue
        tm = re.search(r'^# (.+)', md, re.MULTILINE)
        if not tm:
            continue
        title = tm.group(1).strip()
        cat_match = re.search(r'(entities|concepts|sources|synthesis)', md[:200])
        category = cat_match.group(1) if cat_match else "concepts"
        md = md.replace("(我会填入)", today)
        wiki_dir = WIKI_DIR / category
        wiki_dir.mkdir(parents=True, exist_ok=True)
        fn = f"{topic}-{today}.md".replace(" ", "-").replace("/", "-")
        wp = wiki_dir / fn
        wp.write_text(md, encoding="utf-8")
        total += 1
        print(f"  [合成] -> {fn}")
        update_wiki_index(title, category, today)
        state.setdefault("synthesized_topics", []).append(topic)
    return total


def update_wiki_index(title, category, date_str):
    ip = WIKI_DIR / "index.md"
    WIKI_DIR.mkdir(parents=True, exist_ok=True)
    cl = {"concepts": "概念", "entities": "实体", "sources": "来源", "synthesis": "综合"}
    clb = cl.get(category, category)
    nr = f"| [[{title}]] | 自动合成 | {date_str} |\n"
    if not ip.exists():
        ip.write_text(f"# 钢铁意志 Wiki 索引\n\n## {clb}\n| 页面 | 概述 | 更新日期 |\n|------|------|--------|\n{nr}\n", encoding="utf-8")
        return
    c = ip.read_text(encoding="utf-8")
    sm = f"## {clb}"
    if sm in c:
        lines = c.split("\n")
        found = False
        for i, line in enumerate(lines):
            if line.startswith(sm):
                found = True
                continue
            if found and line.startswith("## "):
                lines.insert(i, nr.rstrip())
                break
        else:
            if found:
                lines.append(nr.rstrip())
        ip.write_text("\n".join(lines), encoding="utf-8")
    else:
        ip.write_text(c + f"\n{sm}\n| 页面 | 概述 | 更新日期 |\n|------|------|--------|\n{nr}\n", encoding="utf-8")


def cleanup_old_l1():
    """删除 >7 天的旧 L1 文件"""
    cutoff = datetime.now() - timedelta(days=7)
    deleted = 0

    for fp in L1_DIR.glob("*.md"):
        match = re.match(r"^(\d{4}-\d{2}-\d{2})", fp.stem)
        if not match:
            continue
        file_date = datetime.strptime(match.group(1), "%Y-%m-%d")
        if file_date < cutoff:
            try:
                fp.unlink()
                deleted += 1
                print(f"  [清理] 删除: {fp.name}")
            except Exception as e:
                print(f"  [清理] 删除失败: {fp.name} - {e}")

    return deleted


def run_daily_refinement():
    """每天一次的精炼主流程"""
    state = load_refiner_state()
    today = datetime.now().strftime("%Y-%m-%d")

    # 今天已经检查过了（无论有没有炼到东西）
    if state.get("lastCheckDate") == today:
        print(f"[精炼] 今日({today})已检查过，跳过")
        return

    print(f"[精炼] === 开始每日记忆精炼 ===")
    print(f"[精炼] 上次提炼至: {state.get('lastRefinedDate') or '从未'}")

    # 找到需要炼的 L1
    files = get_l1_files_to_refine(state["lastRefinedDate"])
    if not files:
        print(f"[精炼] 没有新的 L1 文件需要提炼 (lastRefined={state['lastRefinedDate']})")
        d = cleanup_old_l1()
        if d: print(f"[清理] 共删除 {d} 个过期文件")
        state["lastCheckDate"] = today
    else:
        file_dates = []
        for fp in files:
            m = re.match(r"^(\d{4}-\d{2}-\d{2})", fp.stem)
            if m: file_dates.append(m.group(1))
        all_content = []
        for fp in files:
            try:
                content = fp.read_text(encoding="utf-8", errors="replace")
                all_content.append(f"=== {fp.stem} ===\n{content}\n")
            except:
                pass
        l1_text = "\n".join(all_content)
        batches = split_into_batches(l1_text)
        if len(batches) > 1:
            print(f"  [精炼] 内容 {len(l1_text)} 字符 > 单批上限 {REFINE_BATCH_CHARS}，"
                  f"自动拆成 {len(batches)} 批")

        memories, failed = [], 0
        for i, batch in enumerate(batches, 1):
            tag = f"批次 {i}/{len(batches)}" if len(batches) > 1 else "单批"
            print(f"  [精炼] --- {tag}: {len(batch)} 字符 ---")
            got = call_zhipu_refine(batch, file_dates)
            if got is None:
                failed += 1
                print(f"  [精炼] WARN {tag} 整批失败")
            else:
                memories.extend(got)

        if memories:
            written = write_refined_memories(memories)
            print(f"  [精炼] LLM 产出 {len(memories)} 条记忆 -> L3 写入 {written} 条")
        else:
            print(f"  [精炼] LLM 未产出具价值的记忆")
        deleted = cleanup_old_l1()
        if deleted: print(f"  [清理] 共删除 {deleted} 个过期文件")

        if failed:
            # 有批次整批失败 -> 不推进游标，下次定时任务会自动重跑这几天的内容。
            # L3 写入按内容哈希去重，重跑不会产生重复条目。
            max_refined = state.get("lastRefinedDate", "")
            print(f"  [精炼] ⚠️ {failed}/{len(batches)} 批失败，"
                  f"不推进 lastRefinedDate（{max_refined or '(空)'}），下次会自动重试")
        else:
            max_refined = max(file_dates) if file_dates else today
            state["lastRefinedDate"] = max_refined
        state["lastRunDate"] = today
        state["lastCheckDate"] = today
        print(f"[精炼] === 完成: lastRefined={max_refined or '(未推进)'} ===")

    # L3→Wiki 合成（无论有没有新 L1，都检查一次）
    wiki_count = synthesize_to_wiki(state)
    if wiki_count:
        print(f"[合成] === 完成: +{wiki_count} Wiki页面 ===")
    save_refiner_state(state)


# ============================================================
# 主入口
# ============================================================

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--once", action="store_true", help="单次扫描后退出")
    p.add_argument("--refine-only", action="store_true", help="仅执行精炼，不监控")
    p.add_argument("--interval", type=float, default=TICK, help=f"事件循环间隔秒（默认 {TICK}s）")
    a = p.parse_args()

    L1_DIR.mkdir(parents=True, exist_ok=True)
    SYSTEM_DIR.mkdir(parents=True, exist_ok=True)

    # === 每日精炼（仅一次） ===
    run_daily_refinement()

    if a.refine_only:
        print("[精炼] 完成，退出")
        return

    # === 实时监控：扫描全部 JSONL，哪个变了处理哪个 ===
    state = load_state()
    total = 0
    tick = a.interval

    # 扫描所有存在的 JSONL 文件
    def get_all_jsonl_files():
        files = []
        if SESSIONS_DIR.exists():
            for sd in SESSIONS_DIR.iterdir():
                if not sd.is_dir(): continue
                for fp in sd.glob("*.jsonl"):
                    files.append(fp)
        return files

    file_mtimes = {}  # {str(path): mtime}
    # 初始化：记录所有现有文件的 mtime
    for fp in get_all_jsonl_files():
        file_mtimes[str(fp)] = fp.stat().st_mtime

    print(f"\n[Watcher V6.1] 实时监控 {SESSIONS_DIR}")
    print(f"  模式: 全量扫描 + {tick}s 事件循环")
    print(f"  跟踪文件: {len(file_mtimes)} 个 session JSONL")
    print(f"  已知信号: {len(state.get('known', {}))} 条")
    print(f"  等待 PI 写入 session JSONL...\n")

    if a.once:
        for fp in get_all_jsonl_files():
            n = process(fp, state)
            if n:
                total += n
                print(f"  [{datetime.now().strftime('%H:%M:%S')}] {fp.name}: +{n}")
        save_state(state)
        print(f"[DONE] total={total}")
        return

    try:
        heartbeat_counter = 0
        while True:
            # 扫描所有 JSONL 文件，检查 mtime 变化
            changed = 0
            for fp in get_all_jsonl_files():
                fkey = str(fp)
                current_mtime = fp.stat().st_mtime
                if fkey not in file_mtimes or current_mtime > file_mtimes[fkey]:
                    file_mtimes[fkey] = current_mtime
                    now = time.time()
                    # 防抖
                    if now - file_mtimes.get(f"__debounce_{fkey}", 0) > DEBOUNCE_SEC:
                        n = process(fp, state)
                        if n:
                            total += n
                            changed += 1
                            save_state(state)
                            now_str = datetime.now().strftime("%H:%M:%S")
                            print(f"  [{now_str}] {fp.name[:50]} +{n} (total={total})")
                        file_mtimes[f"__debounce_{fkey}"] = now

            # 心跳: 每30秒一次
            heartbeat_counter += 1
            if heartbeat_counter % 150 == 0:
                now_str = datetime.now().strftime("%H:%M:%S")
                print(f"  [{now_str}] 心跳 | 监控{len(file_mtimes)}个文件 | L1已写: {total}")
            time.sleep(tick)
    except KeyboardInterrupt:
        save_state(state)
        print(f"\n[STOP] total={total}")


if __name__ == "__main__":
    main()
