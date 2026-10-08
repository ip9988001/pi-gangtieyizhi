结构分层：`memory/wiki/` 是结构化知识层（最高事实来源）。暂时的对话碎片只存入 `l1/`，严禁直接写入 wiki。
分类一致性：必须严格遵循四种分类：`entities`（实体）, `concepts`（概念）, `sources`（来源）, `synthesis`（综合）。
自动化触发缓存：`memory/wiki_candidates/pending/` 是自动触发输出的缓冲安全区。
触发信号词：记住、重要、教训、规则、模式、结论、方案。
写入规则：自动触发必须先写入 `pending/` 文件夹。只有经过人工审查的候选内容才能晋升到 `memory/wiki/`。
Wiki 健康维护：在进行大规模 Wiki 重构前，必须运行 `wiki_lint` 或 `/steel-will-wiki-lint` 进行健康检查。重复标题、缺失元数据、编码错误均视为第一优先级维护任务。