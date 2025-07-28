<template>
  <div class="voice-recorder">
    <div class="recorder-controls">
      <el-button
        :type="isRecording ? 'danger' : 'primary'"
        :icon="isRecording ? 'Microphone' : 'Microphone'"
        @mousedown="startRecording"
        @mouseup="stopRecording"
        @mouseleave="stopRecording"
        @touchstart="startRecording"
        @touchend="stopRecording"
        :disabled="!isSupported"
        class="record-button"
      >
        {{ isRecording ? '松开结束' : '按住录音' }}
      </el-button>

      <div v-if="isRecording" class="recording-indicator">
        <div class="pulse"></div>
        <span>{{ recordingTime }}s</span>
      </div>
    </div>

    <div v-if="audioUrl" class="audio-preview">
      <audio :src="audioUrl" controls></audio>
      <div class="audio-actions">
        <el-button size="small" @click="sendVoice">发送</el-button>
        <el-button size="small" @click="cancelVoice">取消</el-button>
      </div>
    </div>

    <div v-if="!isSupported" class="not-supported">您的浏览器不支持语音录制功能，请使用现代浏览器并允许麦克风权限</div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Microphone } from '@element-plus/icons-vue';

const props = defineProps<{
  maxDuration?: number; // 最大录音时长（秒）
}>();

const emit = defineEmits<{
  send: [audioBlob: Blob, duration: number];
  cancel: [];
}>();

const isRecording = ref(false);
const isSupported = ref(false);
const mediaRecorder = ref<MediaRecorder | null>(null);
const audioChunks = ref<Blob[]>([]);
const audioUrl = ref<string>('');
const recordingTime = ref(0);
const recordingTimer = ref<number | null>(null);
const startTime = ref(0);
const errorMessage = ref<string>('');
const currentStream = ref<MediaStream | null>(null);

const maxDuration = props.maxDuration || 60; // 默认最大60秒

onMounted(() => {
  checkSupport();
});

onUnmounted(() => {
  cleanup();
});

const cleanup = () => {
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
  }
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
  if (currentStream.value) {
    currentStream.value.getTracks().forEach((track) => track.stop());
  }
};

const checkSupport = async () => {
  try {
    // 检查浏览器是否支持 MediaRecorder
    if (!window.MediaRecorder) {
      throw new Error('浏览器不支持 MediaRecorder API');
    }

    // 检查是否支持 getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持 getUserMedia API');
    }

    // 尝试获取音频权限
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1,
      },
    });

    // 立即停止测试流
    stream.getTracks().forEach((track) => track.stop());
    isSupported.value = true;
    errorMessage.value = '';

    console.log('语音录制功能检查通过');
  } catch (error) {
    console.error('浏览器不支持语音录制:', error);
    isSupported.value = false;
    errorMessage.value = `语音录制不可用: ${error.message}`;
  }
};

const startRecording = async () => {
  if (!isSupported.value || isRecording.value) return;

  try {
    errorMessage.value = '';

    // 获取音频流，使用更好的音频配置
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1,
      },
    });

    currentStream.value = stream;

    // 检查是否有音频轨道
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('没有检测到音频输入设备');
    }

    console.log('音频轨道信息:', audioTracks[0].getSettings());

    // 创建 MediaRecorder，使用更兼容的格式
    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000,
    };

    // 如果 webm 格式不支持，尝试其他格式
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'audio/mp4';
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'audio/wav';
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = '';
    }

    console.log('使用的音频格式:', options.mimeType || '默认格式');

    mediaRecorder.value = new MediaRecorder(stream, options);
    audioChunks.value = [];

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data);
        console.log('接收到音频数据:', event.data.size, 'bytes');
      }
    };

    mediaRecorder.value.onstop = () => {
      if (audioChunks.value.length > 0) {
        const audioBlob = new Blob(audioChunks.value, {
          type: options.mimeType || 'audio/webm',
        });
        audioUrl.value = URL.createObjectURL(audioBlob);
        console.log('录音完成，文件大小:', audioBlob.size, 'bytes');
      } else {
        console.warn('没有录制到音频数据');
        ElMessage.warning('没有录制到音频，请检查麦克风是否正常工作');
      }

      // 停止所有音轨
      if (currentStream.value) {
        currentStream.value.getTracks().forEach((track) => track.stop());
        currentStream.value = null;
      }
    };

    mediaRecorder.value.onerror = (event) => {
      console.error('录音错误:', event);
      ElMessage.error('录音过程中发生错误');
      stopRecording();
    };

    mediaRecorder.value.start(1000); // 每秒收集一次数据
    isRecording.value = true;
    startTime.value = Date.now();

    console.log('开始录音...');

    // 开始计时
    recordingTimer.value = window.setInterval(() => {
      recordingTime.value = Math.floor((Date.now() - startTime.value) / 1000);

      // 达到最大时长自动停止
      if (recordingTime.value >= maxDuration) {
        stopRecording();
        ElMessage.warning(`录音时长不能超过${maxDuration}秒`);
      }
    }, 1000);
  } catch (error) {
    console.error('开始录音失败:', error);
    errorMessage.value = `录音失败: ${error.message}`;
    ElMessage.error(`无法访问麦克风: ${error.message}`);
  }
};

const stopRecording = () => {
  if (!isRecording.value || !mediaRecorder.value) return;

  console.log('停止录音...');
  mediaRecorder.value.stop();
  isRecording.value = false;

  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
    recordingTimer.value = null;
  }
};

const sendVoice = () => {
  if (!audioUrl.value || audioChunks.value.length === 0) {
    ElMessage.warning('没有可发送的语音数据');
    return;
  }

  // 从 audioChunks 创建 Blob
  const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm' });
  console.log('发送语音消息，大小:', audioBlob.size, 'bytes，时长:', recordingTime.value, '秒');
  emit('send', audioBlob, recordingTime.value);

  // 清理
  cancelVoice();
};

const cancelVoice = () => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = '';
  }
  audioChunks.value = [];
  recordingTime.value = 0;
  errorMessage.value = '';
  emit('cancel');
};
</script>

<style scoped>
.voice-recorder {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.recorder-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.record-button {
  min-width: 120px;
  height: 40px;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
  font-weight: bold;
}

.pulse {
  width: 12px;
  height: 12px;
  background-color: #f56c6c;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.audio-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audio-preview audio {
  width: 100%;
  height: 40px;
}

.audio-actions {
  display: flex;
  gap: 8px;
}

.not-supported {
  color: #909399;
  text-align: center;
  padding: 20px;
}

.error-message {
  color: #f56c6c;
  text-align: center;
  padding: 10px;
  background: #fef0f0;
  border-radius: 4px;
  margin-top: 10px;
}
</style> 