<template>
  <div class="voice-message" :class="{ 'is-mine': isMine }">
    <div class="voice-content">
      <div class="voice-icon" @click="togglePlay">
        <el-icon :size="20" :color="isPlaying ? '#409eff' : '#606266'">
          <component :is="playIcon" />
        </el-icon>
      </div>

      <div class="voice-info">
        <div class="voice-duration">{{ formatDuration(duration) }}</div>
        <div class="voice-waveform">
          <div v-for="i in 20" :key="i" class="wave-bar" :class="{ active: isPlaying && i <= currentBar }"></div>
        </div>
      </div>

      <div class="voice-time">{{ formatTime(timestamp) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';

const props = defineProps<{
  audioUrl: string;
  duration: number;
  timestamp: Date;
  isMine: boolean;
}>();

const isPlaying = ref(false);
const currentBar = ref(0);
const audio = ref<HTMLAudioElement | null>(null);
const animationFrame = ref<number | null>(null);

const playIcon = computed(() => {
  return isPlaying.value ? VideoPause : VideoPlay;
});

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTime = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const togglePlay = () => {
  if (isPlaying.value) {
    stopPlay();
  } else {
    startPlay();
  }
};

const startPlay = () => {
  if (!audio.value) {
    audio.value = new Audio(props.audioUrl);

    audio.value.addEventListener('ended', () => {
      stopPlay();
    });

    audio.value.addEventListener('timeupdate', () => {
      if (audio.value) {
        const progress = audio.value.currentTime / audio.value.duration;
        currentBar.value = Math.floor(progress * 20);
      }
    });
  }

  audio.value.play();
  isPlaying.value = true;

  // 开始波形动画
  startWaveformAnimation();
};

const stopPlay = () => {
  if (audio.value) {
    audio.value.pause();
    audio.value.currentTime = 0;
  }
  isPlaying.value = false;
  currentBar.value = 0;

  // 停止波形动画
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
    animationFrame.value = null;
  }
};

const startWaveformAnimation = () => {
  let startTime = Date.now();

  const animate = () => {
    if (!isPlaying.value) return;

    const elapsed = Date.now() - startTime;
    const progress = (elapsed / (props.duration * 1000)) * 20;
    currentBar.value = Math.min(Math.floor(progress), 20);

    if (currentBar.value < 20) {
      animationFrame.value = requestAnimationFrame(animate);
    }
  };

  animationFrame.value = requestAnimationFrame(animate);
};

onUnmounted(() => {
  if (audio.value) {
    audio.value.pause();
    audio.value = null;
  }
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
});
</script>

<style scoped>
.voice-message {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

/* 移动端语音消息适配 */
@media screen and (max-width: 767px) {
  .voice-message {
    margin: 6px 0;
  }
}

.voice-message.is-mine {
  justify-content: flex-end;
}

.voice-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  max-width: 300px;
  min-width: 120px;
}

/* 移动端语音内容适配 */
@media screen and (max-width: 767px) {
  .voice-content {
    gap: 8px;
    padding: 10px 12px;
    max-width: 250px;
    min-width: 100px;
  }
}

.voice-icon {
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

/* 移动端语音图标适配 */
@media screen and (max-width: 767px) {
  .voice-icon {
    padding: 6px;
    min-width: 32px;
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.voice-icon:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

/* 移动端悬停效果优化 */
@media screen and (max-width: 767px) {
  .voice-icon:active {
    background-color: rgba(64, 158, 255, 0.2);
    transform: scale(0.95);
  }
}

.voice-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 移动端语音信息适配 */
@media screen and (max-width: 767px) {
  .voice-info {
    gap: 3px;
  }
}

.voice-duration {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

/* 移动端时长适配 */
@media screen and (max-width: 767px) {
  .voice-duration {
    font-size: 11px;
  }
}

.voice-waveform {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 20px;
}

/* 移动端波形适配 */
@media screen and (max-width: 767px) {
  .voice-waveform {
    gap: 1px;
    height: 16px;
  }
}

.wave-bar {
  width: 2px;
  height: 8px;
  background-color: #dcdfe6;
  border-radius: 1px;
  transition: all 0.2s ease;
}

/* 移动端波形条适配 */
@media screen and (max-width: 767px) {
  .wave-bar {
    width: 1.5px;
    height: 6px;
  }
}

.wave-bar.active {
  background-color: #409eff;
  height: 16px;
}

/* 移动端激活波形条适配 */
@media screen and (max-width: 767px) {
  .wave-bar.active {
    height: 12px;
  }
}

.voice-time {
  font-size: 11px;
  color: #c0c4cc;
  white-space: nowrap;
}

/* 移动端时间适配 */
@media screen and (max-width: 767px) {
  .voice-time {
    font-size: 10px;
  }
}

/* 我的消息样式 */
.voice-message.is-mine .voice-content {
  background: #409eff;
  color: white;
}

.voice-message.is-mine .voice-duration {
  color: rgba(255, 255, 255, 0.8);
}

.voice-message.is-mine .voice-time {
  color: rgba(255, 255, 255, 0.6);
}

.voice-message.is-mine .wave-bar {
  background-color: rgba(255, 255, 255, 0.3);
}

.voice-message.is-mine .wave-bar.active {
  background-color: white;
}

/* 移动端触摸优化 */
@media screen and (max-width: 767px) {
  * {
    -webkit-tap-highlight-color: transparent;
  }

  .voice-icon {
    -webkit-tap-highlight-color: transparent;
  }
}

/* 移动端图标大小适配 */
@media screen and (max-width: 767px) {
  :deep(.el-icon) {
    font-size: 16px !important;
  }
}

/* 移动端安全区域适配 */
@supports (padding: max(0px)) {
  @media screen and (max-width: 767px) {
    .voice-content {
      padding-left: max(12px, env(safe-area-inset-left));
      padding-right: max(12px, env(safe-area-inset-right));
    }
  }
}
</style> 