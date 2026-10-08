# 钢铁意志系统关键路径

## 1. PI主程序安装路径
```
C:\Users\35881\AppData\Roaming\npm\node_modules\@earendil-works\pi-coding-agent\
```
- 这是npm全局安装的PI核心引擎
- 包含框架能力、扩展系统、工具注册等

## 2. 钢铁意志29个包部署路径
```
C:\Users\35881\.pi\agent\
```
- extensions/ - 29个扩展（.ts文件）
- skills/ - 29个技能（SKILL.md）
- services/ - 1个服务
- memory/ - 记忆数据（规则文件、子目录）
- assets/ - 资产目录
- AGENTS.md - 系统提示词
- settings.json - 配置

## 3. PI-WebUI系统安装路径
```
C:\Users\35881\AppData\Roaming\npm\node_modules\@agegr\pi-web\
```
- 这是第三方WebUI
- 启动脚本：C:\Users\35881\Desktop\Pi-Web.bat
- 端口：30141

## 4. 当前会话ID（第二阶段部署完成）
```
019e8ad5-920b-7756-ab28-18d7f1da45ae
```
- 会话时间：2026-06-03
- 会话内容：完成钢铁意志第二阶段7个包部署
- 恢复命令：`pi --resume 019e8ad5-920b-7756-ab28-18d7f1da45ae`

## 备注
- PI主程序和WebUI是npm全局安装，在Roaming目录下
- 钢铁意志系统是用户数据，在.pi/agent目录下
- 两者分离，PI更新不会覆盖钢铁意志系统
