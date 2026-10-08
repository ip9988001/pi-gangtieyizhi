## 这是什么
这是钢铁意志·PI版的记忆骨架，定义了记忆目录的最小结构。

## 根层前台文件和 memory/ 目录的关系
1. 根层前台文件是快速访问入口
2. memory/ 目录是详细存储位置
3. 根层文件指向 memory/ 目录
4. memory/ 目录包含所有详细内容

## memory/user/ 最小作用
1. `profile/` - 用户基本信息
2. `preferences/` - 用户偏好
3. `people/` - 用户联系人
4. `events/` - 用户事件

## memory/agent/ 最小作用
1. `decisions/` - 决策记录
2. `lessons/` - 失败教训
3. `cases/` - 成功案例
4. `patterns/` - 工作模式
5. `projects/` - 项目状态
6. `reflections/` - 系统反思
7. `actions/` - 操作日志
8. `system/` - 系统配置

## memory/candidates/ 最小作用
1. `user/` - 用户相关候选
2. `agent/` - Agent相关候选

## memory/.archive/ 最小作用
1. 存档不再活跃的记忆
2. 不是删除桶
3. 可以恢复
4. 保留历史

## L1 / L2 / L3 最小落点
1. L1：`memory/l1/YYYY-MM-DD.md` - 原始碎片
2. L2：`memory/candidates/` - 候选筛选
3. L3：`memory/agent/` - 永久存储

## Hot / Warm / Cold 不是第三套生命周期
1. Hot：频繁访问的前台文件
2. Warm：偶尔访问的后台文件
3. Cold：很少访问的存档文件
4. 这只是访问频率，不是生命周期
