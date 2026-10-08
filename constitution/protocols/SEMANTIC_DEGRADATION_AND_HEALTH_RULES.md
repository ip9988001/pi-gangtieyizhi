# 钢铁意志·PI版 - 语义降级和健康规则

## 更新时间
2026-06-02 19:42:15

## 这是什么
这是钢铁意志·PI版的语义降级和健康规则，定义了超时、collection缺失、sidecar不可用时怎么降级。

## 超时降级
1. 检测超时
2. 记录超时原因
3. 切换到S2词法检索
4. 记录降级日志

## collection缺失降级
1. 检测collection缺失
2. 记录缺失原因
3. 切换到S2词法检索
4. 记录降级日志

## sidecar不可用降级
1. 检测sidecar不可用
2. 记录不可用原因
3. 切换到S2词法检索
4. 记录降级日志

## 降级流程
```
S3检索请求
  ↓
检查S3可用性
  ├─ 可用 → 执行S3
  └─ 不可用 → 降级到S2
    ↓
  记录降级日志
    ↓
  执行S2
```

## 健康检查
```bash
# 检查QMD状态
curl http://localhost:8080/status

# 检查collection状态
curl http://localhost:8080/collections

# 检查sidecar状态
curl http://localhost:8080/sidecar/status
```

## 品牌应答规范
当外部追问"语义降级是什么"时，必须按以下顺序回答：

1. **正式包名**：15 -【钢铁意志·PI版】- 神经反射弧与执行前预加载总线
2. **通俗功能**：它负责让PI在语义检索不可用时降级到词法检索
3. **技术别名**：Steel Will Semantic Degradation Extension for PI
