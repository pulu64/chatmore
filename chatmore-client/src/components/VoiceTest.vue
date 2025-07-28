<template>
  <div class="voice-test">
    <h3>语音消息功能测试</h3>

    <div class="test-section">
      <h4>1. 语音录制测试</h4>
      <VoiceRecorder :max-duration="30" @send="handleVoiceSend" @cancel="handleVoiceCancel" />
    </div>

    <div class="test-section" v-if="testVoiceUrl">
      <h4>2. 语音播放测试</h4>
      <VoiceMessage :audio-url="testVoiceUrl" :duration="testDuration" :timestamp="new Date()" :is-mine="true" />
    </div>

    <div class="test-section">
      <h4>3. 功能说明</h4>
      <ul>
        <li>点击"按住录音"按钮开始录音</li>
        <li>松开按钮结束录音</li>
        <li>录音完成后可以预览和发送</li>
        <li>语音消息支持播放控制和波形动画</li>
        <li>最大录音时长：60秒</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import VoiceRecorder from './VoiceRecorder.vue';
import VoiceMessage from './VoiceMessage.vue';

const testVoiceUrl = ref<string>('');
const testDuration = ref<number>(0);

const handleVoiceSend = (audioBlob: Blob, duration: number) => {
  // 创建临时 URL 用于测试
  testVoiceUrl.value = URL.createObjectURL(audioBlob);
  testDuration.value = duration;
  console.log('语音录制完成:', { duration, size: audioBlob.size });
};

const handleVoiceCancel = () => {
  if (testVoiceUrl.value) {
    URL.revokeObjectURL(testVoiceUrl.value);
    testVoiceUrl.value = '';
  }
  testDuration.value = 0;
};
</script>

<style scoped>
.voice-test {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.test-section h4 {
  margin-top: 0;
  color: #409eff;
}

ul {
  margin: 10px 0;
  padding-left: 20px;
}

li {
  margin: 5px 0;
  color: #606266;
}
</style> 