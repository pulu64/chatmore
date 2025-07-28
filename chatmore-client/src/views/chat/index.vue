<template>
  <div class="chat-page">
    <router-view @idFromList="handleIdfromCard"></router-view>
    <!-- 移动端初始不显示聊天窗口，只有点击ChatCard后才显示 -->
    <div class="chat-window" v-show="!isMobile || (isMobile && !isHide && id !== '')">
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
      <div class="prompt" v-show="isHide">
        <el-avatar :size="80" :src="`${SERVER_URL}/avatar/${personalDetail.profilePicture}`" />
        <h5>Hey🎉, {{ personalDetail.username }}!</h5>
        <p>👈Please select a chat to start messaging.</p>
      </div>
      <el-container v-show="!isHide">
        <el-header>
          <div class="media">
            <div class="avatar">
              <RouterLink :to="{ name: 'profile', query: { id, type } }" active-class="active">
                <el-badge is-dot class="item" :offset="[-6, 6]" :color="badgeColor" badge-style="width:11px;height:11px;">
                  <el-avatar :size="50" :src="`${SERVER_URL}/avatar/${avatar}`" />
                </el-badge>
              </RouterLink>
            </div>
            <div class="media-body">
              <h6>{{ chatName }}</h6>
              <p>{{ signature }}</p>
            </div>
            <el-dropdown @command="handleCommand" v-if="type === 'group'">
              <span class="el-dropdown-link">
                功能列表
                <!-- <i class="iconfont icon-lianxiren"></i> -->
                <el-icon class="el-icon--right">
                  <arrow-down />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="choose" v-if="role !== 'normal'">邀请入群</el-dropdown-item>
                  <el-dropdown-item command="exit-group" v-if="role !== 'owner'">退出群聊</el-dropdown-item>
                  <el-dropdown-item command="destroy-group" v-if="role === 'owner'">解散群聊</el-dropdown-item>
                  <!-- <el-dropdown-item>Action 3</el-dropdown-item>
                    <el-dropdown-item disabled>Action 4</el-dropdown-item>
                    <el-dropdown-item divided>Action 5</el-dropdown-item> -->
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <div class="chat-room">
          <el-scrollbar ref="scrollbarRef" max-height="100%">
            <div class="chat-list" ref="inner">
              <MessageCard v-for="item in messageArr" :key="item._id" :item="item" :type="type"></MessageCard>
            </div>
          </el-scrollbar>
        </div>

        <el-footer>
          <textarea name="" id="" placeholder="请输入内容" v-model="inputMessage" @keydown.enter.prevent="handleSendMessage"></textarea>
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link"> 上传 </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="upload"><input type="file" @change="handlechange" /></el-dropdown-item>
                <el-dropdown-item command="voice">语音消息</el-dropdown-item>
                <el-dropdown-item>上传文件</el-dropdown-item>
                <!-- <el-dropdown-item>Action 3</el-dropdown-item>
                <el-dropdown-item disabled>Action 4</el-dropdown-item>
                <el-dropdown-item divided>Action 5</el-dropdown-item> -->
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button color="var(--bs-green)" @click="handleSendMessage">
            发送&nbsp;
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              aria-hidden="true"
              role="img"
              class="iconify iconify--ri"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M1.946 9.315c-.522-.174-.526-.455.01-.634L21.044 2.32c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.678.045L12 14l6-8l-8 6z"
              ></path>
            </svg>
          </el-button>
        </el-footer>
      </el-container>
    </div>
  </div>
</template>

<script lang="ts">
import MessageCard from '@/components/MessageCard.vue';
import { storeToRefs } from 'pinia';
import { sign } from 'crypto';
import emitter from '@/utils/emitter';
import ShowProfile from '../user/show-profile.vue';
import ChooseList from '@/components/ChooseList.vue';
import VoiceRecorder from '@/components/VoiceRecorder.vue';
import { uploadFile, uploadVoice } from '../../api/modules/upload';
import { SERVER_URL } from '@/api/index';
export default {
  name: 'chat-window',
  components: {
    MessageCard,
    ChooseList,
  },
};
</script>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { useChatStore } from '@/stores/chat';
import { watch, nextTick, computed, inject, onMounted, ref } from 'vue';
import { SERVER_URL } from '@/api/index';
const chatStore = useChatStore();
const { messageGather, chatMap, userGather, groupGather, personalDetail } = storeToRefs(chatStore);
const { sendPrivateMessage, sendGroupMessage } = chatStore;

// 计算好友列表，用于邀请入群功能
const friendMap = computed(() => {
  const friends = chatMap.value.filter((item) => {
    return item.type === 'user';
  });
  const result = friends.map((item) => item.id.toString());
  console.log('friendMap computed:', result); // 调试信息
  return result;
});

// 在线状态颜色常量
const COLOR_ONLINE = 'var(--bs-green)';
const COLOR_OFFLINE = '#ff4d4f';
const COLOR_BUSY = 'var(--bs-yellow)';

// 计算当前聊天对象的在线状态颜色
const badgeColor = computed(() => {
  if (type.value === 'user') {
    const user = userGather.value[id.value];
    if (user) {
      if (user.state === 'active') return COLOR_ONLINE;
      if (user.state === 'busy') return COLOR_BUSY;
      if (user.state === 'offline') return COLOR_OFFLINE;
    }
    return COLOR_OFFLINE;
  }
  // 群聊不显示在线色，返回默认
  return COLOR_ONLINE;
});

let isActive = ref(false);
let isChooseActive = ref(false);
let isConfirm = ref(false);
let isHide = ref(false);
let isVoiceActive = ref(false);
let eventType: string;

let id = ref('');
let role = ref('');
let chatName = ref('请点击一个聊天卡片~');
let messageArr = ref({});
let signature = ref('');
let avatar = ref('group.png');
let type = ref('');
let inputMessage = ref('');

// 检测是否为移动端
const isMobile = computed(() => {
  return window.innerWidth <= 767;
});

/* 发送消息 */

async function handleSendMessage() {
  if (inputMessage.value === '') {
    ElMessage.warning('内容不能为空！');
  }
  if (type.value === 'user') {
    await sendPrivateMessage({ receiverId: id.value, type: 'text', messageText: inputMessage.value });
  } else if (type.value === 'group') {
    await sendGroupMessage({ groupId: id.value, type: 'text', messageText: inputMessage.value });
  }
  inputMessage.value = '';
}

// 标记消息为已读
function markMessagesAsRead(chatId, chatType) {
  if (chatStore.socket) {
    chatStore.socket.emit('markMessagesAsRead', {
      chatId,
      chatType,
    });
  }
}

/* 打开相关chatRoom */

function handleIdfromCard(chatId, name, chatType) {
  id.value = chatId;
  messageArr.value = messageGather.value[chatId];
  chatName.value = name;
  type.value = chatType;
  if (chatType === 'user') {
    signature.value = userGather.value[chatId].signature;
    avatar.value = userGather.value[chatId].profilePicture;
  } else if (chatType === 'group') {
    signature.value = groupGather.value[chatId].groupDescription;
    avatar.value = groupGather.value[chatId].groupPicture;
    role.value = groupGather.value[chatId].role;
  }

  // 标记消息为已读
  markMessagesAsRead(chatId, chatType);
}

const handleCommand = (command: string | number | object) => {
  if (command === 'choose') {
    isActive.value = true;
    isChooseActive.value = true;
  } else if (command === 'voice') {
    isActive.value = true;
    isVoiceActive.value = true;
  } else if (command === 'exit-group') {
    isActive.value = true;
    eventType = command;
    isConfirm.value = true;
  } else if (command === 'destroy-group') {
    isActive.value = true;
    eventType = command;
    isConfirm.value = true;
  } else if (command === 'upload') {
  }
};

watch(
  id,
  () => {
    if (id.value === '') {
      isHide.value = true;
    } else {
      isHide.value = false;
    }
  },
  { immediate: true }
);

//提交建群申请
function getArr(arr) {
  if (arr.length === 0) {
    emitter.emit('notice', '选择不可为空~');
  } else {
    let data = {
      groupId: id.value,
      receiverIds: arr,
    };
    chatStore.InviteGroup(data);
    emitter.emit('notice', '您已发送入群邀请~');
  }
  handleCancel();
}

function forward() {
  if (eventType === 'exit-group') {
    chatStore.exitGroup({
      groupId: id.value,
      userId: personalDetail.value._id,
    });
  } else if (eventType === 'destroy-group') {
    chatStore.destroyGroup({
      groupId: id.value,
      userId: personalDetail.value._id,
    });
  }
  handleCancel();
}

function handleCancel() {
  isActive.value = false;
  isChooseActive.value = false;
  isConfirm.value = false;
  isVoiceActive.value = false;
}

// 处理语音消息发送
async function handleVoiceSend(audioBlob: Blob, duration: number) {
  try {
    console.log('开始发送语音消息:', { duration, blobSize: audioBlob.size });

    // 上传语音文件
    const result = await uploadVoice(audioBlob);
    console.log('语音上传结果:', result);

    if (result.code !== 200) {
      throw new Error(result.msg || '语音上传失败');
    }

    const filename = result.data.filename;
    console.log('语音文件名:', filename);

    // 发送语音消息
    if (type.value === 'user') {
      console.log('发送私聊语音消息:', { receiverId: id.value, filename, duration });
      await sendPrivateMessage({
        receiverId: id.value,
        type: 'voice',
        messageText: filename,
        duration: duration,
      });
    } else if (type.value === 'group') {
      console.log('发送群聊语音消息:', { groupId: id.value, filename, duration });
      await sendGroupMessage({
        groupId: id.value,
        type: 'voice',
        messageText: filename,
        duration: duration,
      });
    }

    ElMessage.success('语音消息发送成功');
    handleVoiceCancel();
  } catch (error) {
    console.error('发送语音消息失败:', error);
    ElMessage.error('语音消息发送失败: ' + error.message);
  }
}

// 处理语音录制取消
function handleVoiceCancel() {
  isVoiceActive.value = false;
  isActive.value = false;
}

async function handlechange(e) {
  const files = e.target.files || e.dataTransfer.files;
  if (!files.length) return;
  const result = await uploadFile(files[0]);
  console.log(result.msg);
  console.log(result.data.filename);
  if (type.value === 'user') {
    await sendPrivateMessage({ receiverId: id.value, type: 'image', messageText: result.data.filename });
  } else if (type.value === 'group') {
    await sendGroupMessage({ groupId: id.value, type: 'image', messageText: result.data.filename });
  }
}

// 滚动条引用
let scrollbarRef = ref();
let inner = ref();

// 自定义滚动到底部的方法
function scrollToBottom() {
  nextTick(() => {
    if (scrollbarRef.value) {
      scrollbarRef.value.setScrollTop(inner.value.scrollHeight);
    }
  });
}

// 监听消息数组的变化
watch(
  messageArr,
  () => {
    //消息数组变化意味着切换了聊天页面，如果此时页面还停留在邀请入群界面，则需要销毁邀请界面
    isActive.value = false;
    isChooseActive.value = false;
    scrollToBottom();
  },
  { deep: true }
);

//如果群成员身份发生变化，更新role
watch(
  () => {
    if (type.value === 'group') {
      return groupGather.value[id.value]?.adminMap;
    } else {
      return null;
    }
  },
  (newAdminMap) => {
    if (newAdminMap) {
      role.value = newAdminMap.get(personalDetail.value._id);
      if (typeof role.value === 'undefined') {
        role.value = 'normal';
      }
    }
  },
  { immediate: true, deep: true }
);

// 组件挂载后滚动到底部
onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.hide {
  opacity: 0;
}
.fade {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: rgb(0, 0, 0, 0.4);
  z-index: 2;
}
.fade .window {
  margin-left: 350px;
}
.fade .exit-group {
  margin-left: 350px;
  margin-top: 200px;
  padding: 50px 0;
  width: 320px;
  height: 200px;
  background-color: rgb(255, 255, 255);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
}

.fade .voice-modal {
  margin-left: 350px;
  margin-top: 200px;
  width: 400px;
  background-color: rgb(255, 255, 255);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 移动端语音模态框适配 */
@media screen and (max-width: 767px) {
  .fade .voice-modal {
    margin-left: 20px;
    margin-right: 20px;
    margin-top: 100px;
    width: calc(100vw - 40px);
    max-width: 400px;
  }
}

.exit-group h6 {
  margin-bottom: 15px;
}

.chat-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: row;
  flex-basis: auto;
}

/* 移动端聊天页面布局 */
@media screen and (max-width: 767px) {
  .chat-page {
    flex-direction: column;
    height: calc(100vh - 60px); /* 减去Nav的高度 */
  }
}

.chat-window {
  width: 900px;
  flex-grow: 1;
}

/* 移动端聊天窗口适配 */
@media screen and (max-width: 767px) {
  .chat-window {
    width: 100%;
    height: 100%;
  }
}

.prompt {
  height: 100vh;
  font-family: 'IBM Plex Sans', sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 移动端提示区域适配 */
@media screen and (max-width: 767px) {
  .prompt {
    height: calc(100vh - 60px);
    padding: 20px;
    text-align: center;
  }

  .prompt h5 {
    font-size: 18px;
    margin-bottom: 10px;
  }

  .prompt p {
    font-size: 14px;
  }
}

.prompt .el-avatar {
  margin-bottom: 48px;
}

/* 移动端头像适配 */
@media screen and (max-width: 767px) {
  .prompt .el-avatar {
    margin-bottom: 24px;
  }
}

.prompt h5 {
  margin-bottom: 15px;
}

.el-container {
  padding: 0 40px;
  height: 100vh;
}

/* 移动端容器适配 */
@media screen and (max-width: 767px) {
  .el-container {
    padding: 0 16px;
    height: calc(100vh - 60px);
  }
}

.el-header {
  height: 90px;
  padding-left: 40px;
  border-bottom: 1.5px solid rgb(243, 242, 239);
}

/* 移动端头部适配 */
@media screen and (max-width: 767px) {
  .el-header {
    height: 60px;
    padding: 10px 16px;
  }
}

.el-footer {
  height: 90px;
  padding: 0 40px;
  border-top: 1.5px solid rgb(243, 242, 239);
  display: flex;
  flex-direction: row;
  align-items: center;
}

/* 移动端底部适配 */
@media screen and (max-width: 767px) {
  .el-footer {
    height: 60px;
    padding: 10px 16px;
    gap: 8px;
  }
}

.media {
  padding: 16px 0;
  display: flex;
  flex-direction: row;
  align-content: center;
}

/* 移动端媒体区域适配 */
@media screen and (max-width: 767px) {
  .media {
    padding: 12px 0;
    gap: 12px;
  }
}

.media .avatar {
  margin-right: 20px;
}

/* 移动端头像适配 */
@media screen and (max-width: 767px) {
  .media .avatar {
    margin-right: 12px;
  }

  :deep(.el-avatar) {
    width: 40px !important;
    height: 40px !important;
  }
}

.media-body {
  width: 60%;
  height: 50px;
}

/* 移动端媒体体适配 */
@media screen and (max-width: 767px) {
  .media-body {
    width: 50%;
    height: 40px;
  }

  .media-body h6 {
    font-size: 16px;
    margin-bottom: 4px;
  }

  .media-body p {
    font-size: 12px;
  }
}

.media-body h6 {
  margin-bottom: 0;
  margin-right: 10px;
  font-weight: 400;
  font-size: 17px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-body p {
  overflow: hidden;
  margin-right: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(149, 170, 201);
}

.chat-room {
  padding: 0 40px;
  height: calc(100vh - 180px);
}

/* 移动端聊天室适配 */
@media screen and (max-width: 767px) {
  .chat-room {
    padding: 0 16px;
    height: calc(100vh - 180px); /* 减去头部和底部的高度 */
  }
}

.chat-list {
  padding: 20px 0;
}

/* 移动端聊天列表适配 */
@media screen and (max-width: 767px) {
  .chat-list {
    padding: 12px 0;
  }
}

.el-footer textarea {
  width: 740px;
  height: 55px;
  padding: 5px;
}

/* 移动端输入框适配 */
@media screen and (max-width: 767px) {
  .el-footer textarea {
    width: calc(100% - 120px);
    height: 48px;
    padding: 4px;
    resize: none;
    font-size: 16px;
  }
}

.media .el-dropdown {
  width: 150px;
  margin-left: 120px;
}

/* 移动端下拉菜单适配 */
@media screen and (max-width: 767px) {
  .media .el-dropdown {
    width: auto;
    margin-left: auto;
  }
}

.el-footer .el-dropdown {
  height: 32px;
  line-height: 32px;
  width: 45px;
}

/* 移动端底部下拉菜单适配 */
@media screen and (max-width: 767px) {
  .el-footer .el-dropdown {
    height: 40px;
    line-height: 40px;
    width: 40px;
  }
}

.el-dropdown-link {
  outline: none;
}

:deep(.el-dropdown-menu__item) {
  --el-dropdown-menuItem-hover-fill: rgba(33, 170, 147, 0.1);
  --el-dropdown-menuItem-hover-color: var(--bs-green);
}

/* 移动端下拉菜单项适配 */
@media screen and (max-width: 767px) {
  :deep(.el-dropdown-menu__item) {
    padding: 8px 16px;
    font-size: 14px;
  }
}

/* 移动端按钮适配 */
@media screen and (max-width: 767px) {
  .el-button {
    padding: 8px 16px;
    font-size: 14px;
  }
}

/* 移动端滚动条优化 */
@media screen and (max-width: 767px) {
  .el-scrollbar {
    -webkit-overflow-scrolling: touch;
  }
}

/* 移动端触摸优化 */
@media screen and (max-width: 767px) {
  * {
    -webkit-tap-highlight-color: transparent;
  }

  .el-button:active,
  .el-dropdown-link:active {
    transform: scale(0.98);
  }
}
</style>