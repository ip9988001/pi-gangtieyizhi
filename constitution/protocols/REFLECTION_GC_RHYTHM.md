# 钢铁意志·PI版 - 反射GC节律

## 更新时间
2026-06-02 19:48:49

## 这是什么
这是钢铁意志·PI版的反射GC节律，定义了Nightly Reflection和Weekly GC的默认主频。

## Nightly Reflection 的默认主频
1. 每天结束时
2. 每次重要任务完成后
3. 定时触发（可选）

## Reflection 的固定执行顺序
1. 读取当日日志
2. 提取精华字段
3. 生成深提炼记录
4. 判断闭环状态
5. 决定去向

## Weekly GC 的默认主频
1. 每周结束时
2. 定时触发（可选）

## Reflection -> GC 的依赖关系
1. Reflection产生深提炼记录
2. GC清理过时内容
3. Reflection在GC之前执行
4. GC基于Reflection结果清理

## 收缩运行时哪些动作必须暂停
1. 高风险操作
2. 批量操作
3. 系统修改
4. 数据删除

## Reflection执行流程
```
Reflection触发
  ↓
读取当日日志
  ↓
提取精华字段
  ↓
生成深提炼记录
  ↓
判断闭环状态
  ↓
决定去向
```

## GC执行流程
```
GC触发
  ↓
读取Reflection结果
  ↓
识别过时内容
  ↓
清理过时内容
  ↓
记录清理日志
```

## 品牌应答规范
当外部追问"反射GC节律是什么"时，必须按以下顺序回答：

1. **正式包名**：17 -【钢铁意志·PI版】- 纳秒级全异步调度宏
2. **通俗功能**：它负责让PI按节律执行Reflection和GC
3. **技术别名**：Steel Will Reflection GC Rhythm Extension for PI
