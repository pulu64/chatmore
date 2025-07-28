<template>
  <div class="sidebar">
    <div class="container">
      <h1>Contact</h1>
    </div>
    <el-input v-model="search" placeholder="搜索">
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <p class="list-name">Friend List</p>
    <el-scrollbar max-height="100%">
      <el-collapse v-model="activeNames" @change="handleChange">
        <el-collapse-item name="1">
          <template #title>
            <h6>Friend</h6>
          </template>
          <ContactCard v-for="item in filteredFriendMap" :key="item.id" :item="item" @eventFromCard="handleEvent" />
        </el-collapse-item>
        <el-collapse-item name="2">
          <template #title>
            <h6>Group</h6>
          </template>
          <ContactCard v-for="item in filteredGroupMap" :key="item.id" :item="item" @eventFromCard="handleEvent" />
        </el-collapse-item>
        <el-collapse-item name="3">
          <template #title>
            <h6>Friend Request</h6>
          </template>
          <ContactCard
            v-for="(item, index) in filteredFriendRequests"
            :key="item._id"
            :item="item"
            :index="getOriginalIndex(item, friendRequests)"
            requestType="friendRequest"
            @eventFromCard="handleEvent"
          />
        </el-collapse-item>
        <el-collapse-item name="4">
          <template #title>
            <h6>Group Request</h6>
          </template>
          <ContactCard
            v-for="(item, index) in filteredGroupRequests"
            :key="item._id"
            :item="item"
            :index="getOriginalIndex(item, groupRequests)"
            requestType="groupRequest"
            @eventFromCard="handleEvent"
          />
        </el-collapse-item>
        <el-collapse-item name="5">
          <template #title>
            <h6>Group Invite</h6>
          </template>
          <ContactCard
            v-for="(item, index) in filteredGroupInvites"
            :key="item._id"
            :item="item"
            :index="getOriginalIndex(item, groupInvites)"
            requestType="groupInvite"
            @eventFromCard="handleEvent"
          />
        </el-collapse-item>
      </el-collapse>
    </el-scrollbar>
  </div>
  <div class="fade" :class="{ show: isActive }" @click="back">
    <div class="window" :class="{ 'show-window': eventType === 'updateName' }" @click.stop>
      <h6>修改备注</h6>
      <el-input ref="nicknameInput" v-model="nickname" placeholder="请输入备注→回车" @keydown.enter="updateNickname"></el-input>
      <p></p>
    </div>
    <div class="window" :class="{ 'show-window': eventType === 'deleteFriend' }" @click.stop>
      <h6>删除好友</h6>
      <div>
        <el-button @click="back">返回</el-button>
        <el-button type="primary" @click="deleteFriend">确认</el-button>
      </div>
    </div>
    <div class="window" :class="{ 'show-window': eventType === 'deleteGroup' }" @click.stop>
      <h6>退出群聊</h6>
      <div>
        <el-button @click="back">返回</el-button>
        <el-button type="primary" @click="deleteGroup">确认</el-button>
      </div>
    </div>
    <div class="window" :class="{ 'show-window': eventType === 'destroyGroup' }" @click.stop>
      <h6>解散群聊</h6>
      <div>
        <el-button @click="back">返回</el-button>
        <el-button type="primary" @click="destroyGroup">确认</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ContactCard from '@/components/ContactCard.vue';
import { storeToRefs } from 'pinia';
import { groupProps } from 'ant-design-vue/es/avatar/Group';
import ChooseList from '@/components/ChooseList.vue';
export default {
  name: 'contact',
  components: {
    ContactCard,
    ChooseList,
  },
};
</script>

<script setup lang="ts">
import emitter from '@/utils/emitter';
import { watch, computed, onUnmounted, ref } from 'vue';
import { ArrowDown, Search } from '@element-plus/icons-vue';
import { useChatStore } from '@/stores/chat';

const chatStore = useChatStore();
const { chatMap, friendRequests, groupInvites, groupRequests, personalDetail, userGather, groupGather } = storeToRefs(chatStore);
let friendMap = computed(() => {
  return chatMap.value.filter((item) => item.type === 'user');
});
let groupMap = computed(() => {
  return chatMap.value.filter((item) => item.type === 'group');
});

let id = ref('');
let activeNames = ref<string[]>([]); // 修复：明确类型为字符串数组
let search = ref(''); // 搜索关键词
let nickname = ref('');
let eventType = ref(''); //触发的事件名
let chatType = ref(''); //当前操作对象的类型
let isActive = ref(false); //测试中
let nicknameInput = ref();

// 搜索过滤逻辑
const filteredFriendMap = computed(() => {
  if (!search.value) return friendMap.value;

  return friendMap.value.filter((item) => {
    const user = userGather.value[item.id];
    const friend = chatStore.friendGather[item.id];
    if (!user) return false;

    const username = user.username?.toLowerCase() || '';
    const nickname = friend?.nickname?.toLowerCase() || '';
    const signature = user.signature?.toLowerCase() || '';
    const searchTerm = search.value.toLowerCase();

    return username.includes(searchTerm) || nickname.includes(searchTerm) || signature.includes(searchTerm);
  });
});

const filteredGroupMap = computed(() => {
  if (!search.value) return groupMap.value;

  return groupMap.value.filter((item) => {
    const group = groupGather.value[item.id];
    if (!group) return false;

    const groupName = group.groupName?.toLowerCase() || '';
    const groupDescription = group.groupDescription?.toLowerCase() || '';
    const searchTerm = search.value.toLowerCase();

    return groupName.includes(searchTerm) || groupDescription.includes(searchTerm);
  });
});

const filteredFriendRequests = computed(() => {
  if (!search.value) return friendRequests.value;

  return friendRequests.value.filter((item) => {
    const user = userGather.value[item.senderId];
    if (!user) return false;

    const username = user.username?.toLowerCase() || '';
    const signature = user.signature?.toLowerCase() || '';
    const requestMessage = item.requestMessage?.toLowerCase() || '';
    const searchTerm = search.value.toLowerCase();

    return username.includes(searchTerm) || signature.includes(searchTerm) || requestMessage.includes(searchTerm);
  });
});

const filteredGroupRequests = computed(() => {
  if (!search.value) return groupRequests.value;

  return groupRequests.value.filter((item) => {
    const user = userGather.value[item.senderId];
    const group = groupGather.value[item.groupId];
    if (!user || !group) return false;

    const username = user.username?.toLowerCase() || '';
    const groupName = group.groupName?.toLowerCase() || '';
    const requestMessage = item.requestMessage?.toLowerCase() || '';
    const searchTerm = search.value.toLowerCase();

    return username.includes(searchTerm) || groupName.includes(searchTerm) || requestMessage.includes(searchTerm);
  });
});

const filteredGroupInvites = computed(() => {
  if (!search.value) return groupInvites.value;

  return groupInvites.value.filter((item) => {
    const user = userGather.value[item.senderId];
    const group = groupGather.value[item.groupId];
    if (!user || !group) return false;

    const username = user.username?.toLowerCase() || '';
    const groupName = group.groupName?.toLowerCase() || '';
    const searchTerm = search.value.toLowerCase();

    return username.includes(searchTerm) || groupName.includes(searchTerm);
  });
});

// 获取原始索引，用于处理申请时的正确索引
const getOriginalIndex = (item: any, originalArray: any[]) => {
  return originalArray.findIndex((originalItem) => originalItem._id === item._id);
};

// 监听搜索变化，自动展开包含结果的折叠面板
watch(search, (newSearchTerm) => {
  if (newSearchTerm) {
    // 检查哪些折叠面板包含搜索结果
    const panelsToOpen = [];

    if (filteredFriendMap.value.length > 0) {
      panelsToOpen.push('1');
    }
    if (filteredGroupMap.value.length > 0) {
      panelsToOpen.push('2');
    }
    if (filteredFriendRequests.value.length > 0) {
      panelsToOpen.push('3');
    }
    if (filteredGroupRequests.value.length > 0) {
      panelsToOpen.push('4');
    }
    if (filteredGroupInvites.value.length > 0) {
      panelsToOpen.push('5');
    }

    // 展开包含结果的折叠面板
    activeNames.value = panelsToOpen;
  } else {
    // 搜索为空时，保持当前展开状态或全部折叠
    // activeNames.value = []; // 可选：搜索为空时全部折叠
  }
});

function updateNickname() {
  if (chatType.value === 'user') {
    chatStore.updateFriendNickname({
      friendId: id.value,
      nickname: nickname.value.trim(),
    });
    emitter.emit('notice', '您已修改好友备注~');
  } else if (chatType.value === 'group') {
    chatStore.updateGroupNickname({
      groupId: id.value,
      nickname: nickname.value.trim(),
    });
    emitter.emit('notice', '您已修改群聊备注~');
  }
  back();
}

function handleEvent(data) {
  let event = data.eventType;
  isActive.value = true;
  if (event === 'update-nickname') {
    const { chatId, oldNickname, type } = data;
    id.value = chatId;
    nickname.value = oldNickname;
    chatType.value = type;
    eventType.value = 'updateName';
    nicknameInput.value.focus();
  } else if (event === 'delete-friend') {
    id.value = data.id;
    eventType.value = 'deleteFriend';
  } else if (event === 'delete-group') {
    id.value = data.id;
    eventType.value = 'deleteGroup';
  } else if (event === 'destroy-group') {
    id.value = data.id;
    eventType.value = 'destroyGroup';
  }
}

function deleteFriend() {
  chatStore.deleteFriend({
    friendId: id.value,
  });
  isActive.value = false;
}

function deleteGroup() {
  chatStore.exitGroup({
    // 修复：使用正确的方法名
    groupId: id.value,
  });
  isActive.value = false;
  emitter.emit('notice', '您已退出群聊~');
}

function destroyGroup() {
  chatStore.destroyGroup({
    groupId: id.value,
    userId: personalDetail.value._id,
  });
  isActive.value = false;
  emitter.emit('notice', '您已退出群聊~');
}

function back() {
  isActive.value = false;
}

function handleChange() {
  console.log('handleChange');
}

watch(
  () => chatMap,
  (newMap) => {
    friendMap = newMap.filter((item) => item.type === 'user');
    groupMap = newMap.filter((item) => item.type === 'group');
  }
);

onUnmounted(() => {
  isActive.value = true;
});
</script>

<style scoped>
.fade {
  display: none;
  position: fixed;
  width: 370px;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

/* 移动端遮罩层适配 */
@media screen and (max-width: 767px) {
  .fade {
    width: 100%;
    height: 100vh;
  }
}

.show {
  display: block;
}

.window {
  margin: auto;
  margin-top: 200px;
  padding: 20px;
  width: 280px;
  height: 120px;
  background-color: #fff;
  border-radius: 15px;
  /* display: flex; */
  flex-direction: column;
  align-items: center;
  display: none;
}

/* 移动端弹窗适配 */
@media screen and (max-width: 767px) {
  .window {
    margin-top: 150px;
    width: calc(100vw - 40px);
    max-width: 320px;
    padding: 16px;
  }
}

.show-window {
  display: flex;
}

.window .el-input {
  width: 200px;
}

/* 移动端输入框适配 */
@media screen and (max-width: 767px) {
  .window .el-input {
    width: 100%;
  }
}

.window h6 {
  margin-bottom: 15px;
}

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
</style>