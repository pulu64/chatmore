# 语音消息功能文档

## 功能概述

语音消息功能允许用户在聊天中录制和发送语音消息，支持私聊和群聊。该功能包括语音录制、播放、上传和实时传输。

## 技术实现

### 后端实现

#### 1. 数据库模型更新
- **文件**: `chatmore-server/src/models/dbModel.js`
- **修改内容**:
  - `Private_Message` 和 `Group_Message` 模型的 `type` 字段添加 `'voice'` 选项
  - 新增 `duration` 字段存储语音时长（秒）

```javascript
// Private_Message 模型示例
const Private_Message = mongoose.Schema({
  // ... 其他字段
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'voice'], // 添加 'voice'
    required: true
  },
  duration: { // 新增字段
    type: Number,
    default: 0,
    min: 0
  },
  // ... 其他字段
});
```

#### 2. 控制器更新
- **文件**: `chatmore-server/src/server/controllers/chat.js`
- **修改内容**:
  - `sendPrivateMessage` 和 `groupMessage` 函数支持 `duration` 参数
  - 语音消息保存时包含时长信息

#### 3. Socket.IO 事件处理
- **文件**: `chatmore-server/src/server/socket.js`
- **修改内容**:
  - `sendPrivateMessage` 和 `sendGroupMessage` 处理器支持 `duration` 参数

#### 4. 文件上传路由
- **文件**: `chatmore-server/src/router/upload.js`
- **新增内容**:
  - 语音文件上传路由 `/voice`
  - 使用 `multer` 处理语音文件存储
  - 文件存储在 `public/voice/` 目录

```javascript
// 语音文件上传配置
const voiceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../public/voice');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '.webm');
  },
});
```

### 前端实现

#### 1. 类型定义更新
- **文件**: `chatmore-client/src/types/chat.d.ts`
- **修改内容**:
  - `Message` 和 `Group_Message` 接口添加 `duration` 字段
  - `type` 字段支持 `'voice'` 类型

#### 2. 语音录制组件
- **文件**: `chatmore-client/src/components/VoiceRecorder.vue`
- **功能**:
  - 使用 MediaRecorder API 录制音频
  - 支持按住录音/松开结束
  - 实时显示录音时长
  - 最大录音时长限制（默认60秒）
  - 音频预览和播放

#### 3. 语音消息播放组件
- **文件**: `chatmore-client/src/components/VoiceMessage.vue`
- **功能**:
  - 播放语音消息
  - 显示语音时长
  - 波形动画效果
  - 播放控制（播放/暂停）

#### 4. 消息卡片更新
- **文件**: `chatmore-client/src/components/MessageCard.vue`
- **修改内容**:
  - 添加语音消息显示逻辑
  - 集成 `VoiceMessage` 组件

#### 5. 聊天界面集成
- **文件**: `chatmore-client/src/views/chat/index.vue`
- **修改内容**:
  - 添加语音消息发送选项
  - 集成 `VoiceRecorder` 组件
  - 处理语音文件上传和发送

#### 6. API 模块
- **文件**: `chatmore-client/src/api/modules/upload.ts`
- **新增内容**:
  - `uploadVoice` 函数处理语音文件上传

## 使用方法

### 发送语音消息
1. 在聊天界面点击输入框旁边的下拉菜单
2. 选择"语音消息"选项
3. 按住"按住录音"按钮开始录音
4. 松开按钮结束录音
5. 预览录音内容
6. 点击"发送"按钮发送语音消息

### 播放语音消息
1. 点击语音消息的播放按钮
2. 语音将开始播放
3. 可以随时暂停或重新播放

## 文件结构

```
chatmore/
├── chatmore-server/
│   ├── public/
│   │   └── voice/           # 语音文件存储目录
│   ├── src/
│   │   ├── models/
│   │   │   └── dbModel.js   # 数据库模型（已更新）
│   │   ├── router/
│   │   │   └── upload.js    # 文件上传路由（已更新）
│   │   └── server/
│   │       ├── controllers/
│   │       │   └── chat.js  # 聊天控制器（已更新）
│   │       └── socket.js    # Socket.IO 处理（已更新）
└── chatmore-client/
    ├── src/
    │   ├── components/
    │   │   ├── VoiceRecorder.vue    # 语音录制组件
    │   │   ├── VoiceMessage.vue     # 语音播放组件
    │   │   └── MessageCard.vue      # 消息卡片（已更新）
    │   ├── views/
    │   │   └── chat/
    │   │       └── index.vue        # 聊天界面（已更新）
    │   ├── api/
    │   │   └── modules/
    │   │       └── upload.ts        # 上传 API（已更新）
    │   └── types/
    │       └── chat.d.ts            # 类型定义（已更新）
```

## 浏览器兼容性

### 支持的浏览器
- Chrome 47+
- Firefox 44+
- Safari 14.1+
- Edge 79+

### 必需的 API
- MediaRecorder API
- getUserMedia API
- Web Audio API

### 安全要求
- 必须在 HTTPS 环境下使用（localhost 除外）
- 需要用户授权麦克风访问权限

## 故障排除

### 常见问题及解决方案

#### 1. 录不到声音

**可能原因：**
- 麦克风权限未授权
- 浏览器不支持 MediaRecorder API
- 音频设备未正确连接
- 系统音频设置问题

**解决方案：**
1. **检查权限**：
   - 确保浏览器已获得麦克风访问权限
   - 检查浏览器地址栏是否显示麦克风图标
   - 尝试刷新页面重新授权

2. **检查设备**：
   - 确保麦克风设备已正确连接
   - 检查系统音频设置中的默认输入设备
   - 尝试在其他应用中测试麦克风

3. **检查浏览器**：
   - 使用最新版本的现代浏览器
   - 确保在 HTTPS 环境下使用（localhost 除外）
   - 尝试清除浏览器缓存和 Cookie

4. **使用测试页面**：
   - 访问 `MicrophoneTest.vue` 页面进行详细诊断
   - 查看浏览器控制台的错误信息

#### 2. 语音文件上传失败

**可能原因：**
- 网络连接问题
- 服务器存储空间不足
- 文件格式不支持

**解决方案：**
1. 检查网络连接
2. 确认服务器存储空间
3. 检查文件格式（支持 webm、mp4、wav）

#### 3. 语音播放失败

**可能原因：**
- 音频文件损坏
- 浏览器不支持音频格式
- 文件路径错误

**解决方案：**
1. 重新录制语音消息
2. 检查音频文件是否完整
3. 确认文件路径正确

### 调试工具

#### 1. 麦克风测试页面
- **路径**: `chatmore-client/src/views/MicrophoneTest.vue`
- **功能**:
  - 浏览器兼容性检查
  - 麦克风权限检查
  - 音频设备信息显示
  - 实时录音测试
  - 故障排除建议

#### 2. 语音功能测试页面
- **路径**: `chatmore-client/src/views/VoiceTestPage.vue`
- **功能**:
  - 语音录制测试
  - 语音播放测试
  - 语音消息发送测试
  - 详细测试结果记录

### 调试步骤

1. **打开浏览器控制台**：查看详细的错误信息
2. **访问测试页面**：使用专门的测试页面进行诊断
3. **检查权限状态**：确认麦克风权限已正确授权
4. **测试音频设备**：验证麦克风设备正常工作
5. **查看网络请求**：检查文件上传是否成功

## 性能优化

### 音频质量设置
- 采样率：44.1kHz
- 声道数：单声道
- 比特率：128kbps
- 格式：WebM (Opus 编码)

### 文件大小优化
- 最大录音时长：60秒
- 自动压缩音频数据
- 使用高效的音频编码格式

### 用户体验优化
- 实时录音时长显示
- 录音状态指示器
- 音频预览功能
- 错误提示和重试机制

## 未来改进

### 计划功能
1. **语音转文字**：自动将语音转换为文字
2. **语音识别**：支持语音命令和搜索
3. **音频效果**：添加音频滤镜和效果
4. **批量处理**：支持批量语音消息处理
5. **云端存储**：支持语音文件云端存储

### 技术优化
1. **流式传输**：实现实时语音流传输
2. **音频压缩**：进一步优化音频文件大小
3. **多格式支持**：支持更多音频格式
4. **离线录制**：支持离线语音录制

## 注意事项

1. **隐私保护**：语音消息仅存储在服务器上，不会用于其他用途
2. **存储限制**：单个语音文件大小限制为 10MB
3. **时长限制**：单次录音时长限制为 60 秒
4. **格式要求**：建议使用 WebM 格式以获得最佳兼容性
5. **网络要求**：上传大文件需要稳定的网络连接

## 技术支持

如果遇到问题，请：
1. 查看浏览器控制台的错误信息
2. 使用测试页面进行诊断
3. 检查网络连接和权限设置
4. 联系技术支持团队 