<template>
  <div class="chat-window-page">
    <!-- 头部导航 -->
    <div class="chat-header">
      <div class="back-button" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <div class="chat-info">
        <el-avatar :size="40" :src="`${SERVER_URL}/avatar/${avatar}`" />
        <div class="info-text">
          <h6>{{ chatName }}</h6>
          <p>{{ signature }}</p>
        </div>
      </div>
      <div class="header-actions">
        <el-dropdown @command="handleCommand" v-if="type === 'group'">
          <span class="el-dropdown-link">
            <el-icon><MoreFilled /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="choose" v-if="role !== 'normal'">邀请入群</el-dropdown-item>
              <el-dropdown-item command="exit-group" v-if="role !== 'owner'">退出群聊</el-dropdown-item>
              <el-dropdown-item command="destroy-group" v-if="role === 'owner'">解散群聊</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 聊天消息区域 -->
    <div class="chat-messages">
      <el-scrollbar ref="scrollbarRef" max-height="100%">
        <div class="message-list" ref="inner">
          <MessageCard v-for="item in messageArr" :key="item._id" :item="item" :type="type"></MessageCard>
        </div>
      </el-scrollbar>
    </div>

    <!-- 底部输入区域 -->
    <div class="chat-input">
      <textarea placeholder="请输入内容" v-model="inputMessage" @keydown.enter.prevent="handleSendMessage"></textarea>
      <el-dropdown @command="handleCommand">
        <span class="el-dropdown-link">
          <el-icon><Plus /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="upload">
              <input type="file" @change="handlechange" />
            </el-dropdown-item>
            <el-dropdown-item command="voice">语音消息</el-dropdown-item>
            <el-dropdown-item>上传文件</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button color="var(--bs-green)" @click="handleSendMessage">
        发送
        <el-icon><Position /></el-icon>
      </el-button>
    </div>

    <!-- 模态框 -->
    <div :class="{ fade: isActive }">
      <ChooseList
        v-show="isChooseActive"
        type="inviteGroup"
        :active="isChooseActive"
        :data="friendMap"
        :groupId="id"
        @invite-group="getArr"
        @cancel="handleCancel"
      ></ChooseList>
      <div v-show="isVoiceActive" class="voice-modal">
        <VoiceRecorder :max-duration="60" @send="handleVoiceSend" @cancel="handleVoiceCancel" />
      </div>
      <div v-show="isConfirm" class="exit-group">
        <h6 v-if="role !== 'owner'">是否退出群聊？😭</h6>
        <h6 v-if="role === 'owner'">是否解散群聊？😭</h6>
        <div>
          <el-button @click="handleCancel">返回</el-button>
          <el-button type="primary" @click="forward">确认</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ChatWindow',
};
</script>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { SERVER_URL } from '@/api/index';
import MessageCard from '@/components/MessageCard.vue';
import VoiceRecorder from '@/components/VoiceRecorder.vue';
import ChooseList from '@/components/ChooseList.vue';
import { ArrowLeft, MoreFilled, Plus, Position } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();

// 获取聊天ID
const chatId = computed(() => route.params.id as string);

// 响应式数据
const inputMessage = ref('');
const messageArr = ref([]);
const isActive = ref(false);
const isChooseActive = ref(false);
const isVoiceActive = ref(false);
const isConfirm = ref(false);
const scrollbarRef = ref();
const inner = ref();

// 从store获取数据
const { personalDetail, messageGather, userGather, friendGather, groupGather, chatMap } = storeToRefs(chatStore);

// 聊天信息
const id = ref(chatId.value);
const type = ref('');
const role = ref('');
const chatName = ref('聊天对象');
const avatar = ref('group.png');
const signature = ref('在线');

// 初始化聊天数据
const initializeChatData = () => {
  const chatId = route.params.id as string;
  console.log('初始化聊天数据，ID:', chatId);

  // 从chatMap中找到对应的聊天
  const chatItem = chatMap.value.find((item) => item.id === chatId);
  if (chatItem) {
    type.value = chatItem.type;
    id.value = chatId;

    if (type.value === 'user') {
      // 私聊
      const user = userGather.value[chatId];
      const friend = friendGather.value[chatId];
      if (user) {
        chatName.value = user.username;
        avatar.value = user.profilePicture;
        signature.value = user.state === 'active' ? '在线' : '离线';
      }
    } else if (type.value === 'group') {
      // 群聊
      const group = groupGather.value[chatId];
      if (group) {
        chatName.value = group.groupName;
        avatar.value = group.groupPicture;
        signature.value = `${group.memberCount || 0}人`;
        role.value = group.adminMap?.get(personalDetail._id) || 'normal';
      }
    }

    // 加载消息
    messageArr.value = messageGather.value[chatId] || [];
  }
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 处理命令
const handleCommand = (command: string) => {
  if (command === 'choose') {
    isChooseActive.value = true;
    isActive.value = true;
  } else if (command === 'voice') {
    isVoiceActive.value = true;
    isActive.value = true;
  } else if (command === 'exit-group') {
    isConfirm.value = true;
    isActive.value = true;
  } else if (command === 'destroy-group') {
    isConfirm.value = true;
    isActive.value = true;
  }
};

// 处理取消
const handleCancel = () => {
  isActive.value = false;
  isChooseActive.value = false;
  isVoiceActive.value = false;
  isConfirm.value = false;
};

// 处理发送消息
const handleSendMessage = () => {
  if (inputMessage.value.trim()) {
    // 发送消息逻辑
    console.log('发送消息:', inputMessage.value);
    inputMessage.value = '';
  }
};

// 处理文件上传
const handlechange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    console.log('上传文件:', target.files[0]);
  }
};

// 处理语音发送
const handleVoiceSend = (audioBlob: Blob) => {
  console.log('发送语音消息');
  handleCancel();
};

// 处理语音取消
const handleVoiceCancel = () => {
  handleCancel();
};

// 处理邀请群组
const getArr = (arr: any[]) => {
  console.log('邀请用户:', arr);
  handleCancel();
};

// 处理确认操作
const forward = () => {
  console.log('确认操作');
  handleCancel();
};

// 组件挂载时初始化数据
onMounted(() => {
  initializeChatData();
});

// 监听路由参数变化
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      initializeChatData();
    }
  }
);

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (scrollbarRef.value) {
      scrollbarRef.value.setScrollTop(9999);
    }
  });
};

// 监听消息变化
watch(
  messageArr,
  () => {
    scrollToBottom();
  },
  { deep: true }
);

// 监听消息变化
watch(
  messageArr,
  () => {
    scrollToBottom();
  },
  { deep: true }
);
</script>

<style scoped>
.chat-window-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.chat-header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #f5f5f5;
}

.chat-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-text h6 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.info-text p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.header-actions {
  display: flex;
  align-items: center;
}

.chat-messages {
  flex: 1;
  overflow: hidden;
  background-color: #fff;
}

.message-list {
  padding: 16px;
  background-color: #fff;
}

.chat-input {
  height: 60px;
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

textarea {
  flex: 1;
  height: 36px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 18px;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
}

textarea:focus {
  border-color: var(--bs-green);
}

.el-dropdown-link {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  background-color: #f5f5f5;
  transition: background-color 0.2s;
}

.el-dropdown-link:hover {
  background-color: #e0e0e0;
}

.el-button {
  height: 36px;
  border-radius: 18px;
  padding: 0 16px;
}

/* 模态框样式 */
.fade {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-modal {
  background-color: #fff;
  border-radius: 15px;
  padding: 20px;
  margin: 20px;
  max-width: 400px;
  width: calc(100% - 40px);
}

.exit-group {
  background-color: #fff;
  border-radius: 15px;
  padding: 20px;
  margin: 20px;
  max-width: 300px;
  width: calc(100% - 40px);
  text-align: center;
}

.exit-group h6 {
  margin-bottom: 20px;
  font-size: 16px;
}

.exit-group .el-button {
  margin: 0 8px;
}

/* 移动端优化 */
@media screen and (max-width: 767px) {
  .chat-window-page {
    height: 100vh;
    padding: 0;
  }

  .chat-header {
    padding: 0 12px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }

  .chat-messages {
    margin-top: 60px;
    margin-bottom: 60px;
  }

  .message-list {
    padding: 12px;
  }

  .chat-input {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    padding: 0 12px;
  }

  textarea {
    font-size: 16px; /* 防止iOS缩放 */
  }
}

/* 触摸优化 */
@media (hover: none) and (pointer: coarse) {
  .back-button:active,
  .el-dropdown-link:active {
    transform: scale(0.95);
  }
}
</style> 