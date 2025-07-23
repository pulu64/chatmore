<template>
  <div :class="{ fade: isActive }" @click="back">
    <div class="search" v-show="isSearch" @click.stop>
      <el-input v-model="searchTerm" style="height: 30px" placeholder="输入搜索关键词" @keydown.enter="handle" />
      <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
        <!-- <el-tab-pane label="全部" name="all">待开发</el-tab-pane> -->
        <el-tab-pane label="用户" name="user"></el-tab-pane>
        <el-tab-pane label="群聊" name="group"></el-tab-pane>
        <el-tab-pane label="待开发" name="daikaifa">待开发</el-tab-pane>
      </el-tabs>
      <!-- <h6 v-if="searchArr.length==0">暂无搜索结果</h6> -->
      <div class="alist">
        <el-scrollbar max-height="100%">
          <div class="media" v-for="item in searchArr" :key="item._id">
            <div class="avatar">
              <el-avatar :size="40" :src="`${SERVER_URL}/avatar/${item.profilePicture}`" alt="Avataaars" />
            </div>
            <div class="media-body">
              <h6>{{ item.username }}{{ item.groupName }}</h6>
            </div>
            <el-button @click="addFriendOrGroup(item._id)">添加</el-button>
          </div>
        </el-scrollbar>
      </div>
    </div>
    <div class="add-window" v-show="isAdd" @click.stop>
      <h6>{{ title }}</h6>
      <p>输入验证信息</p>
      <el-input
        v-model="requestMessage"
        maxlength="20"
        resize="none"
        style="width: 240px"
        placeholder="Please input"
        show-word-limit
        type="textarea"
      />
      <div class="buttons">
        <el-button
          @click="
            isAdd = false;
            isSearch = true;
          "
          >取消</el-button
        >
        <el-button @click="addOthers">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'SearchUsers',
};
</script>

<script lang="ts" setup>
import type { TabsPaneContext } from 'element-plus';
import emitter from '@/utils/emitter';
import { onUnmounted, ref } from 'vue';
import { useChatStore } from '@/stores/chat';
import { storeToRefs } from 'pinia';
import { searchUser, searchGroup } from '../../api/modules/search';
import { isSea } from 'node:sea';
import { h } from 'vue';
import { ElNotification } from 'element-plus';
import { SERVER_URL } from '@/api/index';

const notice = (msg) => {
  ElNotification({
    title: 'Title',
    message: h('i', { style: 'color: teal' }, msg),
  });
};

const chatStore = useChatStore();
const { userGather, chatMap, friendGather, groupGather } = storeToRefs(chatStore);

let id = ref('');
let title = ref('');
let requestMessage = ref('hello');
let searchTerm = ref('');
let isActive = ref(false); //测试中
let isSearch = ref(false);
let isAdd = ref(false);
let searchArr = ref([]);
let activeName = ref('all');

const handleClick = (tab: TabsPaneContext) => {
  searchArr.value = [];
  if (tab.props.name === 'all') {
    activeName.value = 'all';
    handle();
  } else if (tab.props.name === 'user') {
    activeName.value = 'user';
    handle();
  } else if (tab.props.name === 'group') {
    activeName.value = 'group';
    handle();
  } else if (tab.props.name === 'daikaifa') {
    activeName.value = 'daikaifa';
    handle();
  }
};

async function handle() {
  if (activeName.value === 'all' && searchTerm.value.trim() != '') {
    const users = await searchUser(searchTerm.value);
    const groups = await searchGroup(searchTerm.value);
    searchArr.value = users.concat(groups);
  } else if (activeName.value === 'user' && searchTerm.value.trim() != '') {
    searchArr.value = await searchUser(searchTerm.value);
  } else if (activeName.value === 'group' && searchTerm.value.trim() != '') {
    searchArr.value = await searchGroup(searchTerm.value);
  }
}

async function addOthers() {
  if (activeName.value === 'user') {
    let data = {
      receiverId: id.value,
      message: requestMessage.value,
    };
    await chatStore.addFriend(data);
    requestMessage.value = 'hello';
    notice('已发送添加好友请求');
  } else if (activeName.value === 'group') {
    let data = {
      groupId: id.value,
      message: requestMessage.value,
    };
    await chatStore.addGroup(data);
    requestMessage.value = 'hello';
    notice('已发送添加群聊请求');
  }
  isAdd.value = false;
  isSearch.value = true;
}
async function addFriendOrGroup(chatId) {
  id.value = chatId;
  if (activeName.value === 'user') {
    if (id.value in friendGather.value) {
      notice('您已经和该用户成为好友了');
      return;
    }
    title.value = '申请添加好友';
  } else if (activeName.value === 'group') {
    if (id.value in groupGather.value) {
      notice('您已经在该群聊中了');
      return;
    }
    title.value = '申请添加群组';
  }
  isSearch.value = false;
  isAdd.value = true;
}

//返回主界面
function back() {
  isActive.value = false;
  isSearch.value = false;
}

// 绑定事件
emitter.on('search', (value) => {
  console.log('search事件被触发', value);
  isActive.value = true;
  isSearch.value = true;
});

onUnmounted(() => {
  // 解绑事件
  emitter.off('search');
  isActive.value = false;
  isSearch.value = false;
});
</script>

<style scoped>
.add-window {
  margin: auto;
  margin-top: 150px;
  padding: 20px 30px;
  width: 300px;
  height: 200px;
  background-color: rgb(255, 255, 255);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.add-window p {
  margin-bottom: 5px;
  color: rgb(149, 170, 201);
}
.buttons {
  margin-top: 15px;
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.friend .el-textarea {
  width: 230px;
}
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  --el-input-focus-border-color: var(--bs-green);
}
:deep(.el-tabs__item) {
  padding: 0 25px;
}
:deep(.el-tabs__item.is-active) {
  color: var(--bs-green);
}
:deep(.el-tabs__item:hover) {
  color: var(--bs-green);
}
:deep(.el-tabs__active-bar) {
  background-color: var(--bs-green);
}
.avatar {
  width: 40px;
  height: 40px;
}
.el-scrollbar {
  padding: 0 5px;
}
.list-name {
  font-size: 16px;
}
.search .el-input {
  width: 500px;
  margin: 5px 0;
}
.show-page {
  display: flex;
}
.fade {
  position: fixed;
  width: 100%;
  height: 100%;
  background-color: rgb(0, 0, 0, 0.4);
  z-index: 2;
}
.search {
  margin: auto;
  margin-top: 100px;
  padding: 20px 0;
  width: 600px;
  height: 550px;
  background-color: rgb(255, 255, 255);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.alist {
  height: 400px;
  width: 500px;
}
/* .search h6{
  font-size: 20px;
  font-weight: 800;
  color:var(--bs-green);
  padding: 16px 0;
} */
.choose {
  width: 100%;
  padding-top: 16px;
  margin-right: 60px;
}
.choose .el-button {
  float: right;
  margin-left: 10px;
}

.media {
  width: 480px;
  align-items: center;
  font-family: 'IBM Plex Sans', sans-serif;
  padding: 0 34px;
  display: flex;
  flex-direction: row;
  align-content: center;
  transition: all 0.3s;
}
.media:hover {
  background-color: rgb(0, 0, 0, 0.1);
}
.media-body {
  width: 300px;
  height: 50px;
}
.media-body p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.media-body p {
  float: right;
  color: rgb(149, 170, 201);
}
.media-body h6 {
  margin-bottom: 0;
  line-height: 50px;
  font-weight: 400;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.el-badge {
  height: 40px;
}
.media .avatar {
  margin-right: 13px;
}
.checkbox {
  display: inline;
  margin-right: 10px;
}
</style>