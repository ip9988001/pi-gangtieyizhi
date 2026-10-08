# 钢铁意志·PI版 - 包28：零号工厂迭代车间与底层代码资产熔铸炉

## 正式包名
28 -【钢铁意志·PI版】- 零号工厂迭代车间与底层代码资产熔铸炉

## 通俗功能
自造工具增强、蓝图-沙箱-测试-列装

## 技术别名
Steel Will Forge & Asset Factory

## 触发条件
当需要：
- 创建工具蓝图
- 在沙箱中测试工具
- 将通过测试的工具列装

## 已注册工具

### 1. create_blueprint
创建工具蓝图。

**参数**：
- `tool_name`: 工具名称
- `description`: 工具描述
- `risk_level`: 风险等级
- `gap_analysis`: 缺口分析

**状态**: blueprint

### 2. test_in_sandbox
在沙箱中测试候选脚本。

**参数**：
- `tool_id`: 工具ID
- `test_script`: 测试脚本

**状态**: sandbox

### 3. enlist_tool
将通过测试的工具列装到资产区。

**参数**：
- `tool_id`: 工具ID
- `test_passed`: 测试是否通过

**状态**: enlisted (通过) / rejected (拒绝)

## 已注册命令

### /forge-status
查看零号工厂状态

## 工具状态流转

```
blueprint → sandbox → testing → enlisted
    ↓           ↓         ↓          ↓
  rejected   rejected   rejected   (终态)
```

### 状态说明
- **blueprint**: 蓝图阶段，设计方案
- **sandbox**: 沙箱阶段，试跑脚本
- **testing**: 测试阶段，自动化测试
- **enlisted**: 列装阶段，注册到资产区
- **rejected**: 拒绝阶段，未通过测试

## 工具流水线

### 1. 蓝图阶段
- 发现工具缺口
- 设计工具方案
- 评估风险等级

### 2. 沙箱阶段
- 编写候选脚本
- 在沙箱中试跑
- 验证基本功能

### 3. 测试阶段
- 编写测试用例
- 执行自动化测试
- 验证功能和安全性

### 4. 列装阶段
- 通过测试的工具
- 注册到资产区
- 可正式使用

## 使用场景

1. **发现工具缺口**：调用create_blueprint创建蓝图
2. **测试工具**：调用test_in_sandbox在沙箱中测试
3. **列装工具**：调用enlist_tool将通过测试的工具列装
