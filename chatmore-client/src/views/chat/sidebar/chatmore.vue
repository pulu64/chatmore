<template>
  <div class="sidebar">
    <div class="container">
      <h1>Chatmore</h1>
      <el-dropdown @command="handleCommand">
        <span class="el-dropdown-link">
          功能列表
          <!-- <i class="iconfont icon-lianxiren"></i> -->
          <el-icon class="el-icon--right">
            <arrow-down />
          </el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="choose">发起群聊</el-dropdown-item>
            <el-dropdown-item command="search">添加好友/群</el-dropdown-item>
            <!-- <el-dropdown-item>Action 3</el-dropdown-item>
            <el-dropdown-item disabled>Action 4</el-dropdown-item>
            <el-dropdown-item divided>Action 5</el-dropdown-item> -->
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <el-input v-model="search" placeholder="搜索">
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <p class="list-name">RECENT CHATS</p>
    <el-scrollbar max-height="100%">
      <ul class="alist">
        <ChatCard @idFromCard="handleId" v-for="item in filteredChatMap" :key="item.id" :item="item" />
      </ul>
    </el-scrollbar>
  </div>
  <div :class="{ fade: isActive }">
    <ChooseList type="buildGroup" :active="isChooseActive" :data="friendMap" @build-group="getArr" @cancel="handleCancel"></ChooseList>
    <div class="window small" v-show="isBuildGroup && isActive">
      <h6>✨建立新群聊✨</h6>
      <div>
        <p>输入群名称</p>
        <el-input ref="nicknameInput" v-model="inputGroupName" placeholder="请输入群昵称"></el-input>
      </div>
      <div>
        <p>输入群介绍</p>
        <el-input
          v-model="inputGroupDescription"
          maxlength="20"
          resize="none"
          style="width: 200px"
          placeholder="Please input"
          show-word-limit
          type="textarea"
        />
      </div>
      <div class="buttons">
        <el-button @click="back">返回</el-button>
        <el-button @click="buildGroup">确认</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ChatCard from '@/components/ChatCard.vue';
import ChooseList from '@/components/ChooseList.vue';
export default {
  name: 'chat-list',
  components: {
    ChatCard,
    ChooseList,
  },
};
</script>

<script setup lang="ts">
import emitter from '@/utils/emitter';
import { ElMessage } from 'element-plus';
import { watch, computed, onUnmounted, ref } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '@/stores/chat';
const chatStore = useChatStore();
let { chatMap, userGather, groupGather } = storeToRefs(chatStore);
const { createGroup } = chatStore;
let filteredChatMap = ref(chatStore.chatMap);

const friendMap = computed(() => {
  const friends = chatMap.value.filter((item) => {
    return item.type === 'user';
  });
  return friends.map((item) => item.id.toString());
});

let isActive = ref(false);
let isChooseActive = ref(false);
let isBuildGroup = ref(false);
let inputGroupName = ref('');
let inputGroupDescription = ref('');
let data = ref({
  groupName: '',
  groupDescription: '',
  members: [],
});

let search = ref();
const handleCommand = (command: string | number | object) => {
  if (command === 'choose') {
    isActive.value = true;
    isChooseActive.value = true;
  } else if (command === 'search') {
    emitter.emit('search', 2);
  }
};

//提交建群申请
function getArr(arr) {
  data.value.members = arr;
  isBuildGroup.value = true;
  isChooseActive.value = false;
}

function back() {
  isBuildGroup.value = false;
  isChooseActive.value = true;
}

function handleCancel() {
  isActive.value = false;
  isChooseActive.value = false;
}

async function buildGroup() {
  if (inputGroupName.value && inputGroupDescription.value) {
    (data.value.groupName = inputGroupName.value),
      (data.value.groupDescription = inputGroupDescription.value),
      chatStore.createGroup(data.value);
    isActive.value = false;
    isBuildGroup.value = false;
    emitter.emit('notice', '您已建立新群聊~');
  } else if (!inputGroupName.value) {
    ElMessage.warning('群名称不能为空！');
  } else if (!inputGroupDescription.value) {
    ElMessage.warning('群介绍不能为空！');
  }
}

watch(search, (newTerm) => {
  const temp = chatMap.value.filter((item) => {
    if (item.type === 'user') {
      return userGather.value[item.id].username.toLowerCase().includes(newTerm.toLowerCase());
      /* userGather.value[item.id].email.includes(search.value); */
    } else if (item.type === 'group') {
      return groupGather.value[item.id].groupName.toLowerCase().includes(newTerm.toLowerCase());
    }
  });
  filteredChatMap.value = temp;
});

watch(chatMap, (newChatMap) => {
  if (typeof search.value === 'undefined' || search.value === '') {
    filteredChatMap.value = newChatMap;
  }
});

//打开聊天页面
const emit = defineEmits(['idFromList']);
function handleId(id, chatName, type) {
  emit('idFromList', id, chatName, type);
}
</script>

<style scoped>
.sidebar {
  padding: 24px;
  padding-bottom: 0;
  width: 370px;
  height: 100vh;
  background-color: rgb(243, 242, 239);
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
}

/* 移动端侧边栏适配 */
@media screen and (max-width: 767px) {
  .sidebar {
    width: 100%;
    height: calc(100vh - 60px); /* 减去Nav的高度 */
    padding: 16px;
    padding-bottom: 0;
  }
}

.container {
  height: 50px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

/* 移动端容器适配 */
@media screen and (max-width: 767px) {
  .container {
    height: 40px;
    margin-bottom: 12px;
  }
}

.container h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--bs-green);
}

/* 移动端标题适配 */
@media screen and (max-width: 767px) {
  .container h1 {
    font-size: 24px;
  }
}

.list-name {
  padding: 10px 20px;
}

/* 移动端列表名称适配 */
@media screen and (max-width: 767px) {
  .list-name {
    padding: 8px 16px;
    font-size: 14px;
  }
}

:deep(.el-input__wrapper) {
  --el-input-focus-border-color: var(--bs-green);
}

.media {
  margin-bottom: 8px;
  width: 320px;
  background-color: #fff;
  border-radius: 5px;
  border: 1px solid transparent;
  box-shadow: 0 0.15rem 0.15rem rgba(0, 0, 0, 0.075);
}

/* 移动端媒体卡片适配 */
@media screen and (max-width: 767px) {
  .media {
    width: 100%;
    margin-bottom: 6px;
  }
}

.media:hover {
  border: 1px solid var(--bs-green);
  transition: 0.3s border;
}

.example-showcase .el-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
}

:deep(.el-collapse-item__content) {
  padding: 0;
  padding-top: 8px;
}

/* 移动端折叠面板内容适配 */
@media screen and (max-width: 767px) {
  :deep(.el-collapse-item__content) {
    padding-top: 6px;
  }
}

:deep(.el-collapse-item__wrap) {
  background-color: transparent;
}

.el-collapse-item h6 {
  margin: 0;
  padding-left: 20px;
}

/* 移动端折叠面板标题适配 */
@media screen and (max-width: 767px) {
  .el-collapse-item h6 {
    padding-left: 16px;
    font-size: 14px;
  }
}

.el-scrollbar {
  height: 75%;
}

/* 移动端滚动条适配 */
@media screen and (max-width: 767px) {
  .el-scrollbar {
    height: calc(100vh - 200px);
  }
}

/* 弹窗样式 */
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

.window.small {
  background-color: #fff;
  border-radius: 15px;
  padding: 20px;
  margin: 20px;
  max-width: 400px;
  width: calc(100% - 40px);
  text-align: center;
}

.window.small h6 {
  margin-bottom: 20px;
  font-size: 18px;
  color: var(--bs-green);
}

.window.small p {
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}

.window.small .el-input {
  margin-bottom: 16px;
}

.window.small .buttons {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 移动端弹窗适配 */
@media screen and (max-width: 767px) {
  .window.small {
    margin: 16px;
    width: calc(100vw - 32px);
    max-width: 320px;
    padding: 16px;
  }

  .window.small h6 {
    font-size: 16px;
    margin-bottom: 16px;
  }

  .window.small p {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .window.small .el-input {
    margin-bottom: 12px;
  }

  .window.small .buttons {
    margin-top: 16px;
    gap: 8px;
  }
}
</style>