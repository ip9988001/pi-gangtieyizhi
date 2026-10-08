# Pi-Web 服务重启

## 触发条件（AI 自动判断）

当出现以下情况时，**自动触发并且执行**此技能：

1. **代码修改后生效**：修改了 pi-web 的 .js/.ts/.css 源文件，需要重启才能让修复生效
2. **配置修改后生效**：修改了 models.json、next.config.ts 等配置文件
3. **服务异常**：pi-web 的文件 API 持续返回 500 错误，且已排除代码问题
4. **服务无响应**：pi-web 进程卡死、无法正常响应请求
5. **端口冲突**：端口 30141 被占用但服务没有正常运行
6. **依赖更新后**：更新了 npm 包（如 pi-coding-agent），需要重启加载新版本
7. **内存/性能问题**：长时间运行后性能下降，需要重启释放资源

## 执行步骤

### 方式一：执行重启 BAT（推荐）
```bash
"C:\Users\35881\Desktop\Pi-Web-Restart.bat"
```

### 方式二：手动重启（BAT 不可用时）
```bash
# 1. 查找并结束进程
netstat -ano | findstr "30141" | findstr "LISTENING"

# 2. 用找到的 PID 结束进程
taskkill /F /PID <PID>

# 3. 等待几秒后启动
start "" powershell.exe -NoExit -ExecutionPolicy Bypass -Command "& 'C:\Users\35881\AppData\Roaming\npm\pi-web.cmd'"
```

## 验证重启成功

```bash
# 检查端口是否被监听
netstat -ano | findstr "30141"

# 测试文件 API 是否正常
curl -s "http://localhost:30141/api/files/C:/Users/35881?type=list"
```

## 注意事项

- 重启会导致当前所有会话中断
- 重启后需要等待几秒让服务完全启动
- 如果 BAT 执行失败，使用手动方式
- 此技能由 AI 自动触发，用户无需手动操作
