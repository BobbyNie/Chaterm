# Portable Build 监控指南

## 监控工具说明

本项目提供了三个脚本来监控GitHub Actions构建状态和Release产物：

### 1. `monitor-portable-build.sh` - 综合监控脚本

**功能:**
- 自动获取最新的GitHub Actions工作流
- 实时监控构建状态 (每30秒刷新)
- 显示所有构建任务的详细状态
- 检查Release创建状态
- 验证portable构建产物是否存在
- 构建完成后自动停止并显示结果

**使用方法:**
```bash
./monitor-portable-build.sh
```

**输出信息:**
- 工作流ID和提交信息
- GitHub Actions整体状态
- 各个构建任务的详细状态
- Release创建时间和标签
- Portable构建产物验证结果

### 2. `quick-check-portable.sh` - 快速检查脚本

**功能:**
- 快速查看最新Release中的构建产物
- 区分安装版和免安装版
- 显示文件大小和下载次数

**使用方法:**
```bash
./quick-check-portable.sh
```

**适用场景:**
- 构建完成后快速验证产物
- 检查portable版本是否正确生成
- 对比不同版本的文件大小

### 3. `view-build-errors.sh` - 错误查看脚本

**功能:**
- 查看失败构建的详细日志
- 提供多种查看方式

**使用方法:**
```bash
# 自动获取最新工作流
./view-build-errors.sh

# 查看特定工作流
./view-build-errors.sh <RUN_ID>
```

## 完整工作流程

### 推送代码后的监控步骤

#### 步骤1: 推送代码
```bash
git add .
git commit -m "feat: add portable build support"
git push origin main
```

#### 步骤2: 启动监控
```bash
./monitor-portable-build.sh
```

#### 步骤3: 等待构建完成
监控脚本会每30秒刷新一次，显示构建进度。构建完成后会自动显示结果。

#### 步骤4: 验证产物
构建成功后，使用快速检查脚本验证portable产物：
```bash
./quick-check-portable.sh
```

## 预期结果

### 成功的构建应该包含:

1. **GitHub Actions状态**
   - ✅ Build (Windows x64)
   - ✅ Build (Windows ia32)
   - ✅ Build (macOS x64)
   - ✅ Build (macOS arm64)

2. **Release构建产物**
   - ✅ 安装版: `Chaterm-x.x.x-cn-setup-x64.exe`
   - ✅ 免安装版: `Chaterm CN x.x.x.exe` (无setup字样)
   - ✅ macOS: `Chaterm-x.x.x-cn-macos-x64.zip`
   - ✅ macOS ARM: `Chaterm-x.x.x-cn-macos-arm64.zip`

3. **文件大小参考**
   - Windows 安装版: ~120-150 MB
   - Windows 免安装版: ~150-200 MB
   - macOS 版本: ~130-170 MB

## 故障排查

### 如果构建失败

1. **查看详细错误**
```bash
./view-build-errors.sh <RUN_ID>
```

2. **常见问题**
- **配置文件语法错误**: 检查 `electron-builder*.yml` 语法
- **依赖安装失败**: 检查网络连接和npm镜像设置
- **构建超时**: macOS构建可能需要较长时间

### 如果Release未创建

1. 检查GitHub Actions工作流是否完成
2. 确认 `.github/workflows/build.yml` 配置正确
3. 查看工作流日志中的Release步骤

### 如果缺少Portable产物

1. 确认 `electron-builder*.yml` 中配置了 `portable` target
2. 检查构建日志中是否有portable相关的输出
3. 验证Windows构建任务是否成功

## 自动化监控

如果需要持续监控多次构建，可以设置定时任务：

```bash
# 每2分钟检查一次构建状态
watch -n 120 ./quick-check-portable.sh
```

## 相关链接

- GitHub Actions: https://github.com/BobbyNie/Chaterm/actions
- Releases: https://github.com/BobbyNie/Chaterm/releases
- 构建配置: `.github/workflows/build.yml`

## 技术要点

### Portable vs NSIS

- **NSIS**: 传统安装程序，需要管理员权限，写入注册表
- **Portable**: 免安装版本，解压即用，无需管理员权限

### 架构支持

- **x64**: 64位系统 (主要支持)
- **ia32**: 32位系统 (兼容性支持)

### 文件命名规则

- 安装版: `*-setup-*.exe`
- 免安装版: `*.exe` (无setup字样)