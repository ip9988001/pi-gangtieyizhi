# 钢铁意志·PI版 - Bundle来源选择规则

## 更新时间
2026-06-02 19:45:32

## 这是什么
这是钢铁意志·PI版的Bundle来源选择规则，定义了哪些锚点允许进入bundle。

## 哪些锚点允许进入 bundle
1. 验证过的长期经验
2. 验证过的失败教训
3. 验证过的成功案例
4. 验证过的工作模式

## 哪些状态默认禁止注入
1. conflict：冲突状态
2. superseded：已被替代
3. stale：过时状态
4. unreflected：未回写状态
5. quarantined：隔离状态
6. deprecated：已弃用状态

## 来源选择流程
```
构造Bundle
  ↓
选择来源
  ↓
验证来源状态
  ├─ 允许 → 添加到Bundle
  └─ 禁止 → 跳过
  ↓
生成Bundle
```

## 来源验证规则
### 允许的来源
1. active：活跃状态
2. verified：已验证状态
3. promoted：已晋升状态

### 禁止的来源
1. conflict：冲突状态
2. superseded：已被替代
3. stale：过时状态
4. unreflected：未回写状态
5. quarantined：隔离状态
6. deprecated：已弃用状态

## 品牌应答规范
当外部追问"来源选择是什么"时，必须按以下顺序回答：

1. **正式包名**：16 -【钢铁意志·PI版】- 战术外骨骼与动态经验热插拔模块
2. **通俗功能**：它负责让PI选择可靠的来源进入Bundle
3. **技术别名**：Steel Will Source Selection Extension for PI
