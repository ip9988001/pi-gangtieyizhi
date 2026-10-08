#!/usr/bin/env python3
"""
钢铁意志 - 技能目录刷新脚本

功能：
1. 扫描所有技能目录，提取 SKILL.md 的 frontmatter
2. 计算目录指纹（所有 SKILL.md 路径+修改时间的 hash）
3. 与状态文件比对，判断是否需要刷新
4. 生成技能目录 MD 文件 + 更新状态文件

触发：由 AI Agent 调用，或手动执行
"""

import os
import hashlib
import json
from pathlib import Path
from datetime import datetime, timezone

# ============ 配置 ============
SKILL_DIRS = [
    Path.home() / ".pi/agent/PI-技能库",
    Path.home() / ".agents/skills",
    Path.home() / ".pi/agent/git/github.com/anthropics/skills/skills",
    Path.home() / ".pi/agent/git/github.com/badlogic/pi-skills",
]

CATALOG_DIR = Path.home() / ".pi/agent/0-AGENTS"
CATALOG_FILE = CATALOG_DIR / "技能目录.md"
STATE_FILE = CATALOG_DIR / "技能目录-状态.md"

# ============ 扫描 ============

def scan_skill_dirs() -> list[dict]:
    """扫描所有技能目录，返回 SKILL.md 信息列表"""
    skills = []
    seen_names = set()
    for skill_dir in SKILL_DIRS:
        if not skill_dir.exists():
            continue
        for skill_path in sorted(skill_dir.iterdir()):
            if not skill_path.is_dir():
                continue
            skill_md = skill_path / "SKILL.md"
            if not skill_md.exists():
                continue
            frontmatter = parse_frontmatter(skill_md)
            has_fm = bool(frontmatter)
            if not has_fm:
                # ponytail: 无 frontmatter 的本地技能不再静默丢弃，降级为兜底元数据
                frontmatter = fallback_frontmatter(skill_md, skill_path.name)
            name = frontmatter.get("name", skill_path.name)
            if name in seen_names:
                continue
            seen_names.add(name)
            mtime = skill_md.stat().st_mtime
            skills.append({
                "name": name,
                "description": frontmatter.get("description", ""),
                "disabled": frontmatter.get("disable-model-invocation", False),
                "has_frontmatter": has_fm,
                "path": str(skill_md.resolve()),
                "mtime": mtime,
                "directory": str(skill_path.resolve()),
            })
    # ponytail: 同名技能只保留首次命中的路径（靠 SKILL_DIRS 顺序定优先级）；
    # 若将来需要按平台分别统计，再升级为「按目录分组」而非去重
    return skills


def parse_frontmatter(filepath: Path) -> dict | None:
    """解析 YAML frontmatter"""
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return None
    lines = content.split("\n")
    if not lines or lines[0].strip() != "---":
        return None
    fm = {}
    in_fm = False
    for line in lines[1:]:
        if line.strip() == "---":
            break
        if ":" in line:
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key:
                fm[key] = value
    return fm if fm else None


def fallback_frontmatter(filepath: Path, dirname: str) -> dict:
    """无 YAML frontmatter 时的兜底：目录名当技能名，首个标题+首行正文当描述"""
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return {"name": dirname, "description": ""}
    title, desc = "", ""
    for line in content.split("\n"):
        s = line.strip()
        if not s:
            continue
        if s.startswith("#"):
            if not title:
                title = s.lstrip("#").strip()
            continue
        if s.startswith((">", "-", "*", "|")):
            s = s.lstrip(">-*| ").strip()
        if s and not desc:
            desc = s
        if title and desc:
            break
    text = f"{title} — {desc}" if title and desc else (title or desc)
    return {"name": dirname, "description": text[:200]}


def compute_fingerprint(skills: list[dict]) -> str:
    """基于所有 SKILL.md 的路径+修改时间计算指纹"""
    data = "".join(f"{s['path']}|{s['mtime']}" for s in skills)
    return hashlib.sha256(data.encode()).hexdigest()[:16]


# ============ 状态文件 ============

def read_state() -> dict | None:
    """读取状态文件"""
    if not STATE_FILE.exists():
        return None
    try:
        content = STATE_FILE.read_text(encoding="utf-8")
        state = {}
        for line in content.split("\n"):
            if ": " in line:
                k, _, v = line.partition(": ")
                state[k.strip()] = v.strip()
        return state
    except Exception:
        return None


def write_state(fingerprint: str, skill_count: int):
    """写入状态文件"""
    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    content = f"""# 技能目录状态

last_refreshed: {now}
skill_count: {skill_count}
directory_fingerprint: {fingerprint}
"""
    STATE_FILE.write_text(content, encoding="utf-8")


# ============ 目录生成 ============

def generate_catalog(skills: list[dict]) -> str:
    """生成技能目录 MD 内容（原始 frontmatter 数据）"""
    active_skills = [s for s in skills if not s["disabled"] and s.get("has_frontmatter", True)]
    disabled_skills = [s for s in skills if s["disabled"] and s.get("has_frontmatter", True)]
    raw_skills = [s for s in skills if not s.get("has_frontmatter", True)]

    lines = [
        "# 技能目录",
        "",
        f"> 自动生成于 {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"> 共 {len(skills)} 个技能（{len(active_skills)} 常驻 + {len(disabled_skills)} 按需加载 + {len(raw_skills)} 本地无 frontmatter）",
        "",
        "---",
        "",
    ]

    if active_skills:
        lines.append("## 🟢 常驻技能（系统提示词内置，无需手动加载）")
        lines.append("")
        lines.append("| 技能名 | 用途 | 路径 |")
        lines.append("|--------|------|------|")
        for s in active_skills:
            desc = s["description"][:120] + ("..." if len(s["description"]) > 120 else "")
            lines.append(f"| {s['name']} | {desc} | {s['path']} |")
        lines.append("")

    if disabled_skills:
        lines.append("## 🔵 按需加载技能（需要时读取 SKILL.md 加载）")
        lines.append("")
        lines.append("| 技能名 | 用途 | 适用场景 | 路径 |")
        lines.append("|--------|------|----------|------|")
        for s in disabled_skills:
            desc = s["description"][:100] + ("..." if len(s["description"]) > 100 else "")
            # 从 description 提取关键词作为场景
            keywords = extract_keywords(s["description"])
            lines.append(f"| {s['name']} | {desc} | {keywords} | {s['path']} |")
        lines.append("")

    if raw_skills:
        lines.append("## ⚪ 本地技能（无 YAML frontmatter，模型不会自动发现，需手动 read 该路径）")
        lines.append("")
        lines.append("| 技能名 | 用途 | 路径 |")
        lines.append("|--------|------|------|")
        for s in raw_skills:
            desc = s["description"][:120] + ("..." if len(s["description"]) > 120 else "")
            lines.append(f"| {s['name']} | {desc} | {s['path']} |")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## 使用方式")
    lines.append("")
    lines.append("1. 从上述表格中找到匹配的技能")
    lines.append("2. 使用 `read` 工具读取对应路径的 SKILL.md 全文")
    lines.append("3. 按 SKILL.md 中的指令执行")
    lines.append("4. 或使用 `/skill:技能名` 命令直接加载")

    return "\n".join(lines)


def extract_keywords(description: str) -> str:
    """从描述中提取关键词作为场景提示"""
    keywords = []
    triggers = {
        "Word": [".docx", "Word", "word document"],
        "PDF": [".pdf", "PDF"],
        "PPT": [".pptx", "slides", "presentation", "deck"],
        "Excel": [".xlsx", ".xlsm", ".csv", ".tsv", "spreadsheet"],
        "网页": ["HTML", "React", "landing page", "website", "UI"],
        "海报": ["poster", "design", "art", ".png"],
        "视频": ["video", "animation", "captions", "subtitles"],
        "文档": ["documentation", "proposal", "spec", "report"],
        "技能开发": ["skill", "MCP server"],
        "测试": ["Playwright", "testing"],
        "API": ["Claude API", "Anthropic SDK"],
    }
    desc_lower = description.lower()
    for category, terms in triggers.items():
        if any(t.lower() in desc_lower for t in terms):
            keywords.append(category)
    return ", ".join(keywords[:3]) if keywords else "通用"


# ============ 主逻辑 ============

def needs_refresh() -> bool:
    """判断是否需要刷新目录"""
    skills = scan_skill_dirs()
    if not skills:
        return False
    current_fingerprint = compute_fingerprint(skills)
    state = read_state()
    if state is None:
        return True
    stored_fingerprint = state.get("directory_fingerprint", "")
    return current_fingerprint != stored_fingerprint


def refresh(force: bool = False) -> dict:
    """
    刷新技能目录
    返回: {"refreshed": bool, "fingerprint": str, "skill_count": int, "message": str}
    """
    skills = scan_skill_dirs()
    if not skills:
        return {"refreshed": False, "fingerprint": "", "skill_count": 0, "message": "未找到任何技能"}

    current_fingerprint = compute_fingerprint(skills)

    if not force:
        state = read_state()
        if state and state.get("directory_fingerprint") == current_fingerprint:
            return {
                "refreshed": False,
                "fingerprint": current_fingerprint,
                "skill_count": len(skills),
                "message": "目录无变化，跳过刷新",
            }

    # 生成目录
    catalog_content = generate_catalog(skills)
    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    CATALOG_FILE.write_text(catalog_content, encoding="utf-8")

    # 更新状态
    write_state(current_fingerprint, len(skills))

    return {
        "refreshed": True,
        "fingerprint": current_fingerprint,
        "skill_count": len(skills),
        "message": f"已刷新，共 {len(skills)} 个技能",
    }


if __name__ == "__main__":
    import sys
    force = "--force" in sys.argv
    result = refresh(force=force)
    print(f"[{'REFRESHED' if result['refreshed'] else 'SKIPPED'}] {result['message']}")
    print(f"  fingerprint: {result['fingerprint']}")
    print(f"  skill_count: {result['skill_count']}")
