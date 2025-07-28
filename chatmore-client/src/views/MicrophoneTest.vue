<template>
  <div class="microphone-test">
    <div class="header">
      <h2>麦克风权限检查与测试</h2>
      <el-button @click="$router.go(-1)">返回</el-button>
    </div>

    <div class="test-container">
      <div class="test-section">
        <h3>1. 浏览器兼容性检查</h3>
        <div class="compatibility-list">
          <div class="compatibility-item">
            <span class="item-label">MediaRecorder API:</span>
            <span :class="['item-status', hasMediaRecorder ? 'success' : 'error']">
              {{ hasMediaRecorder ? '✓ 支持' : '✗ 不支持' }}
            </span>
          </div>
          <div class="compatibility-item">
            <span class="item-label">getUserMedia API:</span>
            <span :class="['item-status', hasGetUserMedia ? 'success' : 'error']">
              {{ hasGetUserMedia ? '✓ 支持' : '✗ 不支持' }}
            </span>
          </div>
          <div class="compatibility-item">
            <span class="item-label">HTTPS 环境:</span>
            <span :class="['item-status', isHttps ? 'success' : 'warning']">
              {{ isHttps ? '✓ 安全环境' : '⚠ 非安全环境' }}
            </span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>2. 麦克风权限检查</h3>
        <div class="permission-controls">
          <el-button type="primary" @click="checkMicrophonePermission" :loading="checkingPermission"> 检查麦克风权限 </el-button>
          <el-button @click="requestMicrophonePermission">请求麦克风权限</el-button>
        </div>

        <div v-if="permissionStatus" class="permission-status">
          <div class="status-item">
            <span class="status-label">权限状态:</span>
            <span :class="['status-value', getPermissionStatusClass(permissionStatus)]">
              {{ getPermissionStatusText(permissionStatus) }}
            </span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>3. 音频设备信息</h3>
        <div v-if="audioDevices.length > 0" class="device-list">
          <div v-for="(device, index) in audioDevices" :key="device.deviceId" class="device-item">
            <h4>设备 {{ index + 1 }}</h4>
            <div class="device-info">
              <p><strong>设备ID:</strong> {{ device.deviceId }}</p>
              <p><strong>设备名称:</strong> {{ device.label || '未知设备' }}</p>
              <p><strong>设备类型:</strong> {{ device.kind }}</p>
            </div>
          </div>
        </div>
        <div v-else class="no-devices">未检测到音频输入设备</div>
      </div>

      <div class="test-section">
        <h3>4. 实时录音测试</h3>
        <div class="recording-test">
          <VoiceRecorder :max-duration="10" @send="handleTestRecording" @cancel="handleTestCancel" />
        </div>

        <div v-if="testResults.length > 0" class="test-results">
          <h4>测试结果:</h4>
          <div v-for="(result, index) in testResults" :key="index" class="result-item">
            <span class="result-time">{{ result.time }}</span>
            <span :class="['result-status', result.success ? 'success' : 'error']">
              {{ result.success ? '成功' : '失败' }}
            </span>
            <span class="result-message">{{ result.message }}</span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>5. 故障排除建议</h3>
        <div class="troubleshooting">
          <div class="trouble-item">
            <h4>🔒 权限问题</h4>
            <ul>
              <li>确保浏览器已获得麦克风访问权限</li>
              <li>检查浏览器地址栏是否显示麦克风图标</li>
              <li>尝试刷新页面重新授权</li>
            </ul>
          </div>

          <div class="trouble-item">
            <h4>🎤 硬件问题</h4>
            <ul>
              <li>确保麦克风设备已正确连接</li>
              <li>检查系统音频设置中的默认输入设备</li>
              <li>尝试在其他应用中测试麦克风</li>
            </ul>
          </div>

          <div class="trouble-item">
            <h4>🌐 浏览器问题</h4>
            <ul>
              <li>使用最新版本的 Chrome、Firefox、Safari 或 Edge</li>
              <li>确保在 HTTPS 环境下使用（localhost 除外）</li>
              <li>尝试清除浏览器缓存和 Cookie</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import VoiceRecorder from '@/components/VoiceRecorder.vue';

const hasMediaRecorder = ref(false);
const hasGetUserMedia = ref(false);
const isHttps = ref(false);
const permissionStatus = ref<string>('');
const checkingPermission = ref(false);
const audioDevices = ref<MediaDeviceInfo[]>([]);
const testResults = ref<Array<{ time: string; success: boolean; message: string }>>([]);

onMounted(() => {
  checkCompatibility();
});

const checkCompatibility = () => {
  // 检查 MediaRecorder API
  hasMediaRecorder.value = !!window.MediaRecorder;

  // 检查 getUserMedia API
  hasGetUserMedia.value = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  // 检查 HTTPS 环境
  isHttps.value = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

  console.log('兼容性检查结果:', {
    hasMediaRecorder: hasMediaRecorder.value,
    hasGetUserMedia: hasGetUserMedia.value,
    isHttps: isHttps.value,
  });
};

const checkMicrophonePermission = async () => {
  checkingPermission.value = true;

  try {
    // 检查权限状态
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      permissionStatus.value = permission.state;
      console.log('麦克风权限状态:', permission.state);
    } else {
      // 如果不支持 permissions API，尝试获取设备列表
      await getAudioDevices();
      permissionStatus.value = 'granted'; // 假设有权限
    }

    addTestResult(true, '权限检查完成');
  } catch (error) {
    console.error('权限检查失败:', error);
    permissionStatus.value = 'denied';
    addTestResult(false, `权限检查失败: ${error.message}`);
  } finally {
    checkingPermission.value = false;
  }
};

const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());

    await getAudioDevices();
    permissionStatus.value = 'granted';
    addTestResult(true, '麦克风权限获取成功');
    ElMessage.success('麦克风权限获取成功');
  } catch (error) {
    console.error('获取麦克风权限失败:', error);
    permissionStatus.value = 'denied';
    addTestResult(false, `获取麦克风权限失败: ${error.message}`);
    ElMessage.error(`获取麦克风权限失败: ${error.message}`);
  }
};

const getAudioDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    audioDevices.value = devices.filter((device) => device.kind === 'audioinput');
    console.log('音频设备列表:', audioDevices.value);
  } catch (error) {
    console.error('获取音频设备失败:', error);
  }
};

const getPermissionStatusClass = (status: string) => {
  switch (status) {
    case 'granted':
      return 'success';
    case 'denied':
      return 'error';
    case 'prompt':
      return 'warning';
    default:
      return 'info';
  }
};

const getPermissionStatusText = (status: string) => {
  switch (status) {
    case 'granted':
      return '已授权';
    case 'denied':
      return '已拒绝';
    case 'prompt':
      return '需要授权';
    default:
      return '未知状态';
  }
};

const handleTestRecording = (audioBlob: Blob, duration: number) => {
  const sizeKB = (audioBlob.size / 1024).toFixed(2);
  addTestResult(true, `录音测试成功 - 时长: ${duration}秒, 大小: ${sizeKB}KB`);

  // 创建临时 URL 用于播放测试
  const audioUrl = URL.createObjectURL(audioBlob);

  // 创建音频元素进行播放测试
  const audio = new Audio(audioUrl);
  audio.onloadedmetadata = () => {
    console.log('音频元数据加载成功');
    URL.revokeObjectURL(audioUrl);
  };
  audio.onerror = () => {
    addTestResult(false, '音频播放测试失败');
    URL.revokeObjectURL(audioUrl);
  };

  ElMessage.success('录音测试成功');
};

const handleTestCancel = () => {
  addTestResult(false, '录音测试取消');
};

const addTestResult = (success: boolean, message: string) => {
  testResults.value.unshift({
    time: new Date().toLocaleTimeString(),
    success,
    message,
  });
};
</script>

<style scoped>
.microphone-test {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e4e7ed;
}

.header h2 {
  margin: 0;
  color: #409eff;
}

.test-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.test-section {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.test-section h3 {
  margin-top: 0;
  color: #409eff;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.compatibility-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compatibility-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.item-label {
  font-weight: bold;
  color: #606266;
}

.item-status {
  font-weight: bold;
}

.item-status.success {
  color: #67c23a;
}

.item-status.error {
  color: #f56c6c;
}

.item-status.warning {
  color: #e6a23c;
}

.permission-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.permission-status {
  margin-top: 15px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-label {
  font-weight: bold;
  color: #606266;
}

.status-value {
  font-weight: bold;
}

.status-value.success {
  color: #67c23a;
}

.status-value.error {
  color: #f56c6c;
}

.status-value.warning {
  color: #e6a23c;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.device-item {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: white;
}

.device-item h4 {
  margin: 0 0 10px 0;
  color: #409eff;
}

.device-info p {
  margin: 5px 0;
  color: #606266;
}

.no-devices {
  color: #909399;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

.recording-test {
  margin-bottom: 20px;
}

.test-results {
  margin-top: 20px;
}

.test-results h4 {
  margin-bottom: 10px;
  color: #606266;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.result-time {
  font-size: 12px;
  color: #909399;
  min-width: 80px;
}

.result-status {
  font-weight: bold;
  min-width: 40px;
}

.result-status.success {
  color: #67c23a;
}

.result-status.error {
  color: #f56c6c;
}

.result-message {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.troubleshooting {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trouble-item {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: white;
}

.trouble-item h4 {
  margin: 0 0 10px 0;
  color: #409eff;
}

.trouble-item ul {
  margin: 0;
  padding-left: 20px;
}

.trouble-item li {
  margin: 5px 0;
  color: #606266;
  line-height: 1.5;
}
</style> 