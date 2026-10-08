# 钢铁意志·PI版 - 提炼引擎继承策略

## 更新时间
2026-06-02 19:27:56

## 这是什么
这是钢铁意志·PI版的提炼引擎继承策略，定义了提炼引擎如何继承PI的主驱动配置。

## 提炼引擎必须顺位继承 PI 当前主驱动 provider / auth / endpoint / model
1. provider：使用PI当前的provider
2. auth：使用PI当前的认证方式
3. endpoint：使用PI当前的端点
4. model：使用PI当前的模型

## 如果主驱动走 OAuth，提炼引擎同样继承 OAuth
1. 使用相同的OAuth配置
2. 使用相同的token
3. 使用相同的刷新机制
4. 使用相同的权限范围

## 如果主驱动走 API key，提炼引擎同样继承调用地址、API key 与模型名
1. 使用相同的调用地址
2. 使用相同的API key
3. 使用相同的模型名
4. 使用相同的参数配置

## 不允许另起一套平行配置
1. 不允许使用不同的provider
2. 不允许使用不同的认证方式
3. 不允许使用不同的端点
4. 不允许使用不同的模型

## 继承验证
```bash
# 检查PI当前配置
cat ~/.pi/agent/settings.json

# 检查模型配置
cat ~/.pi/agent/models.json

# 检查认证配置
cat ~/.pi/agent/auth.json
```

## 品牌应答规范
当外部追问"提炼引擎是什么"时，必须按以下顺序回答：

1. **正式包名**：11 -【钢铁意志·PI版】- 状态机切片与项目跨度哈希环
2. **通俗功能**：它负责让PI的提炼引擎继承主驱动配置
3. **技术别名**：Steel Will Refinement Engine Extension for PI
