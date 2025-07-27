<template>
  <div class="message" :class="{ right: isSender }">
    <RouterLink :to="{ name: 'profile', query: { id, type: 'user' } }" class="link" @click.stop>
      <el-avatar :size="30" :src="avatar" />
    </RouterLink>
    <ul class="message-body">
      <li class="message-item">
        <span class="date">
          <el-tag size="small" type="warning" v-if="role === 'owner'">群主</el-tag>
          <el-tag size="small" v-if="role === 'admin'">管理员</el-tag>
          <el-tag size="small" v-if="role === 'normal'" effect="plain">群成员</el-tag>
          <span>{{ username }}</span>
          <i>{{ time }}</i>
        </span>
        <div v-if="messageType === 'text'" class="message-content">{{ messageText }}</div>
        <div v-if="messageType === 'image'" class="message-content chat-img">
          <div class="lazy-image-container" ref="imageContainer">
            <div v-if="!isLoaded && !isError" class="image-placeholder">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
            <div v-if="isError" class="image-error">
              <el-icon><Picture /></el-icon>
              <span>图片加载失败</span>
            </div>
            <el-image
              v-show="isLoaded && !isError"
              style="width: 200px; height: 200px"
              :src="imageSrc"
              :zoom-rate="1.2"
              :max-scale="7"
              :min-scale="0.2"
              :preview-src-list="srcList"
              :initial-index="0"
              fit="cover"
              @load="onImageLoad"
              @error="onImageError"
            />
          </div>
        </div>
        <div v-if="messageType === 'file'" class="message-content file">
          <img src="../assets/fileImg/pdf.png" alt="" />
          <div class="word">
            <h4>测试.pdf</h4>
            <p>154kb</p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
export default {
  name: 'MessageCard',
};
</script>

<script setup lang="ts">
import { watch, computed, ref, toRefs, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '../stores/chat';
import { storeToRefs } from 'pinia';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { group } from 'console';
import { getGroupSendersDetail, getGroupAdmins } from '@/api/modules/group';
import { SERVER_URL } from '@/api/index';
import { getGroupMembers } from '../api/modules/group';
import emitter from '@/utils/emitter';
import { Loading, Picture } from '@element-plus/icons-vue';

const chatStore = useChatStore();
const { userGather, personalDetail, groupGather } = storeToRefs(chatStore);
const props = defineProps(['item', 'userId', 'type']);
const { item } = toRefs(props);

// 懒加载相关状态
const imageContainer = ref(null);
const isInView = ref(false);
const isLoaded = ref(false);
const isError = ref(false);
const imageSrc = ref('');
const observer = ref(null);

// 图片懒加载逻辑
const initLazyLoading = () => {
  if (!imageContainer.value) return;

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isInView.value = true;
          imageSrc.value = messageText.value;
          observer.value?.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '50px', // 提前50px开始加载
      threshold: 0.1,
    }
  );

  observer.value.observe(imageContainer.value);
};

const onImageLoad = () => {
  isLoaded.value = true;
  isError.value = false;
};

const onImageError = () => {
  isError.value = true;
  isLoaded.value = false;
};

// 组件挂载时初始化懒加载
onMounted(() => {
  if (messageType.value === 'image') {
    initLazyLoading();
  }
});

// 组件卸载时清理观察器
onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});

let id = ref(item.value.senderId);
let username = ref('用户已注销');
let avatar = ref('');
let myId = ref(personalDetail.value._id);
let role = ref('');
let sender = userGather.value[item.value.senderId];
let isSelf = ref(myId.value === item.value.senderId);

if (isSelf.value) {
  username.value = personalDetail.value.username;
  avatar.value = `${SERVER_URL}/avatar/${personalDetail.value.profilePicture}`;
} else {
  if (typeof sender !== 'undefined') {
    username.value = sender.username;
    avatar.value = `${SERVER_URL}/avatar/${sender.profilePicture}`;
  }
}

//如果群成员身份发生变化，更新role
watch(
  () => {
    if (props.type === 'group') {
      return groupGather.value[props.item.groupId]?.adminMap;
    } else {
      return null;
    }
  },
  (newAdminMap) => {
    if (newAdminMap) role.value = newAdminMap.get(props.item.senderId);
    if (typeof role.value === 'undefined') {
      role.value = 'normal';
    }
  },
  { immediate: true, deep: true }
);

let messageType = ref(item.value.type);
let messageText = ref(item.value.messageText);
let time = ref('');
let timestamp = new Date(item.value.timestamp);
time.value = format(timestamp, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
let isSender = isSelf.value ? true : false;

let srcList = [];

if (messageType.value === 'image') {
  messageText.value = `${SERVER_URL}/image/${messageText.value}`;
  srcList[0] = messageText.value;
}
</script>
<style scoped>
.message {
  display: flex;
  flex-direction: row;
  justify-content: start;
}
.right {
  justify-content: flex-end;
}
.link {
  height: 30px;
}
.el-avatar {
  margin-right: 10px;
}
.right .link {
  order: 1;
}
.right .el-avatar {
  margin-left: 10px;
}
.message-content {
  padding: 16px;
  max-width: 400px;
  margin-bottom: 10px;
  border-radius: 15px;
  background-color: rgb(245, 245, 245);
}
.message-content {
  border-top-left-radius: 0;
}
.right .message-content {
  border-top-left-radius: 15px;
  border-top-right-radius: 0;
}
.message-item {
  display: flex;
  flex-direction: column;
}
.message-body {
  padding: 0;
}
.message-item {
  align-items: flex-start;
}
.right .message-item {
  align-items: flex-end;
}
.date {
  color: rgb(149, 170, 201);
  margin-bottom: 8px;
}
.date span {
  margin: 2px;
}
.date i {
  margin: 0 5px;
  display: none;
}
.right .date i {
  float: left;
}
.message-item:hover i {
  display: inline;
}
.chat-img .el-image {
  border-radius: 8px;
}
.lazy-image-container {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
}
.image-placeholder,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  color: #999;
  font-size: 14px;
}
.image-placeholder .loading-icon {
  font-size: 24px;
  margin-bottom: 8px;
  animation: rotate 1s linear infinite;
}
.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: #ff4d4f;
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.file {
  cursor: pointer;
  display: flex;
  align-items: center;
}
.file img {
  width: 50px;
  height: 50px;
  margin-right: 5px;
}
.file h4 {
  display: inline-block;
}
.file p {
  color: rgb(149, 170, 201);
}
</style>