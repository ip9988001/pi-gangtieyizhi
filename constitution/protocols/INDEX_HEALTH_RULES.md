# 钢铁意志·PI版 - INDEX健康规则

## 更新时间
2026-06-02 19:38:37

## 这是什么
这是钢铁意志·PI版的INDEX健康规则，定义了INDEX的健康维护规则。

## 哪些更新时机会触发 INDEX 最小同步
1. 新增重要文件时
2. 删除重要文件时
3. 修改重要文件时
4. 目录结构变化时

## 什么叫低噪音维护
1. 不频繁更新INDEX
2. 不产生不必要的日志
3. 不干扰正常工作
4. 保持系统安静

## 什么症状说明导航已经漂了
1. INDEX指向的文件不存在
2. INDEX指向的目录不存在
3. INDEX的摘要过时
4. INDEX的路径错误

## fallback 和失效要如何留痕
1. 记录fallback原因
2. 记录失效原因
3. 记录处理结果
4. 记录改进措施

## INDEX健康检查
```bash
# 检查INDEX文件是否存在
test -f ~/.pi/agent/memory/INDEX.md && echo "✓ INDEX存在" || echo "✗ INDEX不存在"

# 检查INDEX指向的文件
grep -o '\[.*\](.*\.md)' ~/.pi/agent/memory/INDEX.md | while read link; do
  file=$(echo $link | grep -o '(.*\.md)' | tr -d '()')
  test -f ~/.pi/agent/memory/$file && echo "✓ $file" || echo "✗ $file"
done
```

## INDEX健康维护流程
```
定期检查
  ↓
检查INDEX健康
  ├─ 健康 → 保持原状
  └─ 不健康 → 修复
  ↓
更新INDEX
  ↓
记录维护日志
```

## 品牌应答规范
当外部追问"INDEX健康是什么"时，必须按以下顺序回答：

1. **正式包名**：14 -【钢铁意志·PI版】- 全息倒排树与高维特征指针
2. **通俗功能**：它负责让PI维护INDEX的健康状态
3. **技术别名**：Steel Will INDEX Health Extension for PI
