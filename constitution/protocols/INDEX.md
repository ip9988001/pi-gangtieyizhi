## 高频目录
- [L1原始碎片](l1/) - 原始事实记录
- [L2候选筛选](candidates/) - 候选条目
- [L3长期记忆](agent/) - 长期知识
- [Wiki结构化知识](wiki/) - 结构化知识主库
- [Wiki候选缓冲区](wiki_candidates/) - 自动触发候选池
- [用户记忆](user/) - 用户相关
- [反思记录](reflections/) - 深提炼记录
- [裁决记录](adjudication/) - 裁决历史

## 关键规则
- [单一入口](START_HERE.md) - 系统入口
- [接手链](HANDOFF_CHAIN.md) - 接手路径
- [阶段跟踪](STAGE_TRACKER.md) - 进度跟踪
- [统一口径](UNIFIED_WORDING.md) - 口径管理
- [操作控制台](OPERATIONS_CONSOLE.md) - 操作流程
- [实时记忆面](LIVE_MEMORY_SURFACE.md) - 前台高频
- [默认动作卡](DEFAULT_ACTION_CARD.md) - 日常工作

## 关键运行面
- [当前阶段](goals/current-stage.md) - 当前任务阶段
- [母目标](goals/master-goal.md) - 系统目标
- [完成态定义](goals/completion-definition.md) - 完成标准

## 记忆域
- [记忆域策略](MEMORY_DOMAIN_POLICY.md) - 域职责划分
- [记忆骨架](MEMORY_SKELETON.md) - 目录结构
- [记忆目录映射](MEMORY_DIRECTORY_MAP.md) - 详细映射

## 三级记忆
- [L1写入协议](L1_WRITE_PROTOCOL.md) - L1写入规则
- [L2候选池规则](L2_CANDIDATE_POOL_RULES.md) - L2筛选规则
- [L3知识策略](L3_KNOWLEDGE_POLICY.md) - L3收录标准
- [L3路由图](L3_ROUTE_MAP.md) - L3路由规则

## 安全治理
- [偏好持久协议](PREFERENCE_PERSISTENCE_PROTOCOL.md) - 偏好规则
- [边界读取规则](BOUNDARY_READ_RULES.md) - 边界规则
- [失败学习协议](FAILURE_LEARNING_PROTOCOL.md) - 失败学习
- [冲突裁决规则](CONFLICT_ADJUDICATION_RULES.md) - 冲突处理

## 检索系统
- [INDEX导航协议](INDEX_NAVIGATION_PROTOCOL.md) - 导航规则
- [检索层策略](RETRIEVAL_LAYER_POLICY.md) - 检索层次
- [词法回退规则](LEXICAL_FALLBACK_RULES.md) - 回退规则
- [INDEX健康规则](INDEX_HEALTH_RULES.md) - 健康维护

## 第二阶段系统
- [幻觉检测规则](HALLUCINATION_DETECTION_RULES.md) - 幻觉检测
- [逻辑校验协议](LOGICAL_VALIDATION_PROTOCOL.md) - 逻辑校验
- [冗余检查规则](REDUNDANCY_CHECK_RULES.md) - 冗余检查
- [语义索引协议](SEMANTIC_INDEX_PROTOCOL.md) - 语义索引
- [降维规则](DIMENSIONAL_REDUCTION_RULES.md) - 降维规则
- [向量匹配策略](VECTOR_MATCHING_STRATEGY.md) - 向量匹配
- [图灵闭环规则](TURING_CLOSURE_RULES.md) - 图灵闭环
- [任务克隆协议](TASK_CLONE_PROTOCOL.md) - 任务克隆
- [模式完成策略](PATTERN_COMPLETION_STRATEGY.md) - 模式完成
- [潜意识编排规则](SUBCONSCIOUS_ORCHESTRATION_RULES.md) - 潜意识编排
- [动态重规划协议](DYNAMIC_REPLANNING_PROTOCOL.md) - 动态重规划
- [自主栈策略](AUTONOMIC_STACK_STRATEGY.md) - 自主栈
- [认知负载规则](COGNITIVE_LOAD_RULES.md) - 认知负载
- [Token优化协议](TOKEN_OPTIMIZATION_PROTOCOL.md) - Token优化
- [过载抑制策略](OVERLOAD_SUPPRESSION_STRATEGY.md) - 过载抑制
- [造物工厂规则](FORGE_FACTORY_RULES.md) - 造物工厂
- [代码资产协议](CODE_ASSET_PROTOCOL.md) - 代码资产
- [迭代工作流策略](ITERATION_WORKFLOW_STRATEGY.md) - 迭代工作流
- [幽灵复刻协议](GHOST_RESTORE_PROTOCOL.md) - 幽灵复刻
- [灾难恢复规则](DISASTER_RECOVERY_RULES.md) - 灾难恢复
- [跨域重生策略](CROSS_DOMAIN_REBIRTH_STRATEGY.md) - 跨域重生

## Extension列表（29个）
### 第一阶段（22个 + 1个工具注册层）
1. [steel-will-bootstrap.ts](../extensions/steel-will-bootstrap.ts) - 引导Extension
2. [steel-will-gateway.ts](../extensions/steel-will-gateway.ts) - 网关Extension
3. [steel-will-state-control.ts](../extensions/steel-will-state-control.ts) - 状态控制Extension
4. [steel-will-scheduler.ts](../extensions/steel-will-scheduler.ts) - 调度控制Extension
5. [steel-will-heartbeat.ts](../extensions/steel-will-heartbeat.ts) - 心跳Extension
6. [steel-will-security.ts](../extensions/steel-will-security.ts) - 安全Extension
7. [steel-will-l1-logger.ts](../extensions/steel-will-l1-logger.ts) - L1记录Extension
8. [steel-will-memory-skeleton.ts](../extensions/steel-will-memory-skeleton.ts) - 记忆骨架Extension
9. [steel-will-candidate-screener.ts](../extensions/steel-will-candidate-screener.ts) - 候选筛选Extension
10. [steel-will-long-term.ts](../extensions/steel-will-long-term.ts) - 长期记忆Extension
11. [steel-will-reflection.ts](../extensions/steel-will-reflection.ts) - 反思Extension
12. [steel-will-failure-learner.ts](../extensions/steel-will-failure-learner.ts) - 失败学习Extension
13. [steel-will-adjudicator.ts](../extensions/steel-will-adjudicator.ts) - 裁决Extension
14. [steel-will-retrieval.ts](../extensions/steel-will-retrieval.ts) - 检索Extension
15. [steel-will-semantic-retrieval.ts](../extensions/steel-will-semantic-retrieval.ts) - 语义检索服务（类库）
15b. [steel-will-recall-tool.ts](../extensions/steel-will-recall-tool.ts) - **recall_memory 工具注册层** ⭐ NEW
16. [steel-will-experience-injector.ts](../extensions/steel-will-experience-injector.ts) - 经验注入Extension
17. [steel-will-scheduler-v2.ts](../extensions/steel-will-scheduler-v2.ts) - 调度V2 Extension
18. [steel-will-governance.ts](../extensions/steel-will-governance.ts) - 治理Extension
19. [steel-will-swarm.ts](../extensions/steel-will-swarm.ts) - 蜂群Extension
20. [steel-will-sensory.ts](../extensions/steel-will-sensory.ts) - 感知Extension
21. [steel-will-migration.ts](../extensions/steel-will-migration.ts) - 迁移Extension
22. [steel-will-ontology.ts](../extensions/steel-will-ontology.ts) - 本体论Extension

### 第二阶段（7个）
23. [steel-will-hallucination-filter.ts](../extensions/steel-will-hallucination-filter.ts) - 幻觉过滤Extension
24. [steel-will-semantic-radar.ts](../extensions/steel-will-semantic-radar.ts) - 语义雷达Extension
25. [steel-will-turing-closure.ts](../extensions/steel-will-turing-closure.ts) - 图灵闭环Extension
26. [steel-will-subconscious-orchestrator.ts](../extensions/steel-will-subconscious-orchestrator.ts) - 潜意识编排Extension
27. [steel-will-cognitive-throttle.ts](../extensions/steel-will-cognitive-throttle.ts) - 认知抑制Extension
28. [steel-will-forge-factory.ts](../extensions/steel-will-forge-factory.ts) - 造物工厂Extension
29. [steel-will-ghost-restore.ts](../extensions/steel-will-ghost-restore.ts) - 幽灵复刻Extension
30. [steel-will-30-wiki-engine.ts](../extensions/steel-will-30-wiki-engine.ts) - Wiki结构化知识Extension
31. [steel-will-32-auto-trigger.ts](../extensions/steel-will-32-auto-trigger.ts) - Wiki自动触发候选Extension
32. [steel-will-33-lint-system.ts](../extensions/steel-will-33-lint-system.ts) - Wiki健康检查Extension

## Skill列表（29个）
### 第一阶段（22个）
1. [steel-will-bootstrap/SKILL.md](../skills/steel-will-bootstrap/SKILL.md) - 引导Skill
2. [steel-will-gateway/SKILL.md](../skills/steel-will-gateway/SKILL.md) - 网关Skill
3. [steel-will-backwrite/SKILL.md](../skills/steel-will-backwrite/SKILL.md) - 回写Skill
4. [steel-will-scheduler/SKILL.md](../skills/steel-will-scheduler/SKILL.md) - 调度Skill
5. [steel-will-heartbeat/SKILL.md](../skills/steel-will-heartbeat/SKILL.md) - 心跳Skill
6. [steel-will-security/SKILL.md](../skills/steel-will-security/SKILL.md) - 安全Skill
7. [steel-will-l1-logger/SKILL.md](../skills/steel-will-l1-logger/SKILL.md) - L1记录Skill
8. [steel-will-memory-skeleton/SKILL.md](../skills/steel-will-memory-skeleton/SKILL.md) - 记忆骨架Skill
9. [steel-will-candidate-screener/SKILL.md](../skills/steel-will-candidate-screener/SKILL.md) - 候选筛选Skill
10. [steel-will-long-term/SKILL.md](../skills/steel-will-long-term/SKILL.md) - 长期记忆Skill
11. [steel-will-reflection/SKILL.md](../skills/steel-will-reflection/SKILL.md) - 反思Skill
12. [steel-will-failure-learner/SKILL.md](../skills/steel-will-failure-learner/SKILL.md) - 失败学习Skill
13. [steel-will-adjudicator/SKILL.md](../skills/steel-will-adjudicator/SKILL.md) - 裁决Skill
14. [steel-will-retrieval/SKILL.md](../skills/steel-will-retrieval/SKILL.md) - 检索Skill
15. [steel-will-semantic-retrieval/SKILL.md](../skills/steel-will-semantic-retrieval/SKILL.md) - 语义检索Skill
16. [steel-will-experience-injector/SKILL.md](../skills/steel-will-experience-injector/SKILL.md) - 经验注入Skill
17. [steel-will-scheduler-v2/SKILL.md](../skills/steel-will-scheduler-v2/SKILL.md) - 调度V2 Skill
18. [steel-will-governance/SKILL.md](../skills/steel-will-governance/SKILL.md) - 治理Skill
19. [steel-will-swarm/SKILL.md](../skills/steel-will-swarm/SKILL.md) - 蜂群Skill
20. [steel-will-sensory/SKILL.md](../skills/steel-will-sensory/SKILL.md) - 感知Skill
21. [steel-will-migration/SKILL.md](../skills/steel-will-migration/SKILL.md) - 迁移Skill
22. [steel-will-ontology/SKILL.md](../skills/steel-will-ontology/SKILL.md) - 本体论Skill

### 第二阶段（7个）
23. [steel-will-hallucination-filter/SKILL.md](../skills/steel-will-hallucination-filter/SKILL.md) - 幻觉过滤Skill
24. [steel-will-semantic-radar/SKILL.md](../skills/steel-will-semantic-radar/SKILL.md) - 语义雷达Skill
25. [steel-will-turing-closure/SKILL.md](../skills/steel-will-turing-closure/SKILL.md) - 图灵闭环Skill
26. [steel-will-subconscious-orchestrator/SKILL.md](../skills/steel-will-subconscious-orchestrator/SKILL.md) - 潜意识编排Skill
27. [steel-will-cognitive-throttle/SKILL.md](../skills/steel-will-cognitive-throttle/SKILL.md) - 认知抑制Skill
28. [steel-will-forge-factory/SKILL.md](../skills/steel-will-forge-factory/SKILL.md) - 造物工厂Skill
29. [steel-will-ghost-restore/SKILL.md](../skills/steel-will-ghost-restore/SKILL.md) - 幽灵复刻Skill
