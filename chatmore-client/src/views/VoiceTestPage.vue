<template>
  <div class="voice-test-page">
    <div class="header">
      <h2>语音消息功能测试</h2>
      <el-button @click="$router.go(-1)">返回</el-button>
    </div>

    <div class="test-container">
      <div class="test-section">
        <h3>1. 语音录制测试</h3>
        <VoiceRecorder :max-duration="30" @send="handleVoiceSend" @cancel="handleVoiceCancel" />
      </div>

      <div class="test-section" v-if="testVoiceUrl">
        <h3>2. 语音播放测试</h3>
        <VoiceMessage :audio-url="testVoiceUrl" :duration="testDuration" :timestamp="new Date()" :is-mine="true" />
      </div>

      <div class="test-section">
        <h3>3. 语音消息发送测试</h3>
        <div class="test-controls">
          <el-button type="primary" @click="testVoiceMessageSend" :disabled="!testVoiceUrl"> 测试发送语音消息 </el-button>
          <el-button @click="clearTestData">清除测试数据</el-button>
        </div>

        <div v-if="testResults.length > 0" class="test-results">
          <h4>测试结果：</h4>
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
        <h3>4. 功能说明</h3>
        <ul>
          <li>点击"按住录音"按钮开始录音</li>
          <li>松开按钮结束录音</li>
          <li>录音完成后可以预览和发送</li>
          <li>语音消息支持播放控制和波形动画</li>
          <li>最大录音时长：60秒</li>
          <li>支持私聊和群聊语音消息</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import VoiceRecorder from '@/components/VoiceRecorder.vue';
import VoiceMessage from '@/components/VoiceMessage.vue';
import { uploadVoice } from '@/api/modules/upload';

const testVoiceUrl = ref<string>('');
const testDuration = ref<number>(0);
const testAudioBlob = ref<Blob | null>(null);
const testResults = ref<Array<{ time: string; success: boolean; message: string }>>([]);

const handleVoiceSend = (audioBlob: Blob, duration: number) => {
  // 创建临时 URL 用于测试
  testVoiceUrl.value = URL.createObjectURL(audioBlob);
  testDuration.value = duration;
  testAudioBlob.value = audioBlob;
  console.log('语音录制完成:', { duration, size: audioBlob.size });

  addTestResult(true, `语音录制成功，时长: ${duration}秒，大小: ${(audioBlob.size / 1024).toFixed(2)}KB`);
};

const handleVoiceCancel = () => {
  if (testVoiceUrl.value) {
    URL.revokeObjectURL(testVoiceUrl.value);
    testVoiceUrl.value = '';
  }
  testDuration.value = 0;
  testAudioBlob.value = null;
};

const testVoiceMessageSend = async () => {
  if (!testAudioBlob.value) {
    ElMessage.warning('请先录制语音');
    return;
  }

  try {
    console.log('开始测试语音消息发送...');

    // 测试上传
    const result = await uploadVoice(testAudioBlob.value);
    console.log('上传结果:', result);

    if (result.code === 200) {
      addTestResult(true, `语音上传成功，文件名: ${result.data.filename}`);
      ElMessage.success('语音消息发送测试成功');
    } else {
      addTestResult(false, `语音上传失败: ${result.msg}`);
      ElMessage.error('语音消息发送测试失败');
    }
  } catch (error) {
    console.error('语音消息发送测试失败:', error);
    addTestResult(false, `语音消息发送测试失败: ${error.message}`);
    ElMessage.error('语音消息发送测试失败');
  }
};

const clearTestData = () => {
  handleVoiceCancel();
  testResults.value = [];
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
.voice-test-page {
  padding: 20px;
  max-width: 800px;
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

.test-controls {
  display: flex;
  gap: 10px;
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

ul {
  margin: 10px 0;
  padding-left: 20px;
}

li {
  margin: 8px 0;
  color: #606266;
  line-height: 1.5;
}
</style> 