<template>
  <div class="media">
    <div class="avatar">
      <el-badge :is-dot="type === 'user'" :offset="[-6, 6]" :color="color" badge-style="width:11px;height:11px;">
        <el-avatar :size="50" :src="`${SERVER_URL}/avatar/${avatar}`" alt="Avataaars" />
      </el-badge>
    </div>
    <div class="media-body">
      <h6>
        <RouterLink :to="{ name: 'profile', query: { id, type } }" class="link">{{ chatName }}</RouterLink>
      </h6>
      <p v-if="isRequest && requestType === 'groupRequest'">申请加入群：{{ requestGroupName }}</p>
      <p>{{ info }}</p>
    </div>
    <p v-if="state === 'accepted'">已同意</p>
    <p v-if="state === 'rejected'">已拒绝</p>
    <p v-if="state === 'ignored'">已忽视</p>
    <div class="menu" v-show="!(isRequest && state !== 'pending')">
      <el-dropdown @command="handleCommand">
        <span class="el-dropdown-link">
          <el-icon><MoreFilled /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu :class="{ show: !isRequest }">
            <el-dropdown-item command="viewProfile">
              <RouterLink :to="{ name: 'profile', query: { id, type } }"> 查看资料 </RouterLink>
            </el-dropdown-item>
            <el-dropdown-item command="update-nickname">修改备注</el-dropdown-item>
            <el-dropdown-item command="delete-friend" v-if="type === 'user'">删除好友</el-dropdown-item>
            <el-dropdown-item command="delete-group" v-if="type === 'group' && role !== 'owner'">退出群聊</el-dropdown-item>
            <el-dropdown-item command="destroy-group" v-if="type === 'group' && role === 'owner'">解散群聊</el-dropdown-item>
          </el-dropdown-menu>
          <el-dropdown-menu :class="{ show: isRequest }">
            <el-dropdown-item command="agree">同意</el-dropdown-item>
            <el-dropdown-item command="disagree">拒绝</el-dropdown-item>
            <el-dropdown-item command="ignore">忽视</el-dropdown-item>
            <el-dropdown-item command="viewProfile">
              <RouterLink :to="{ name: 'profile', query: { id, type } }"> 查看资料 </RouterLink>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ContactCard',
};
</script>

<script setup lang="ts">
import { watch, ref, toRef, computed } from 'vue';
import { useChatStore } from '../stores/chat';
import { storeToRefs } from 'pinia';
import { differenceInCalendarDays, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { request } from 'http';
import { getGroupProfile } from '../api/modules/group';
import { SERVER_URL } from '@/api/index';
const chatStore = useChatStore();
const { friendRequests, groupRequests, groupInvites } = storeToRefs(chatStore);
const { userGather, friendGather, groupGather } = storeToRefs(chatStore);
const props = defineProps(['item', 'index', 'requestType']);
let state = toRef(props.item, 'state');
let index = toRef(props, 'index'); // 修复：正确引用 props.index
let isRequest = ref(false);

//初始化展示数据
let id = ref('');
let type = ref('');
let role = ref('');
let color = ref('var(--bs-green)');
let name = ref('');
let requestGroupName = ref('');
let nickname = ref('');
let chatName = ref('');
let avatar = ref('');
let info = ref('');

//初始化展示数据
const data = computed(() => {
  if (props.item.type === 'user') {
    return {
      user: userGather.value[props.item.id],
      friend: friendGather.value[props.item.id],
    };
  } else if (props.item.type === 'group') {
    return chatStore.groupGather[props.item.id];
  } else {
    return chatStore.userGather[props.item.senderId.toString()];
  }
});

// 监听 data 的变化，更新 nickname
watch(
  data,
  async (newData, oldData) => {
    if (newData) {
      //名称
      isRequest.value = false;
      type.value = props.item.type;
      if (props.item.type === 'user' || props.item.type === 'group') {
        id.value = props.item.id;
        name.value = type.value === 'user' ? newData.user.username : newData.groupName;
        nickname.value = type.value === 'user' ? newData.friend.nickname : newData.groupNickname;
        avatar.value = type.value === 'user' ? newData.user.profilePicture : newData.groupPicture;
        info.value = type.value === 'user' ? newData.user.signature : newData.groupDescription;
        if (type.value === 'user') {
          newData.user.state === 'active' ? (color.value = 'var(--bs-green)') : (color.value = 'var(--bs-red)');
        } else if (type.value === 'group') {
          role.value = newData.role;
        }
        if (typeof nickname.value !== 'undefined' && nickname.value != '') {
          chatName.value = `${name.value}(${nickname.value})`;
        } else {
          chatName.value = name.value;
        }
      } else {
        //request
        isRequest.value = true;
        id.value = props.item.senderId; // 修复：使用 ref 而不是 computed
        chatName.value = userGather.value[id.value]?.username || '';
        avatar.value = userGather.value[id.value]?.profilePicture || '';
        state.value = props.item.state;
        requestGroupName.value = groupGather.value[props.item.groupId]?.groupName || '';
        if (props.requestType === 'groupInvite') {
          try {
            const result = await getGroupProfile(props.item.groupId);
            info.value = `邀请你加入${result.groupName}`;
          } catch (error) {
            info.value = '邀请你加入群聊';
          }
        }
      }
    }
  },
  { immediate: true, deep: true }
);

const emit = defineEmits(['eventFromCard']);

const handleCommand = (command: string | number | object) => {
  if (command === 'update-nickname') {
    emit('eventFromCard', {
      eventType: command,
      chatId: props.item.id,
      type: type.value,
      oldNickname: nickname.value,
    });
  } else if (command === 'delete-friend') {
    // 添加确认对话框
    if (confirm('确定要删除该好友吗？删除后将无法恢复聊天记录。')) {
      emit('eventFromCard', {
        eventType: command,
        id: id.value,
      });
    }
  } else if (command === 'delete-group') {
    // 添加确认对话框
    if (confirm('确定要退出该群聊吗？')) {
      emit('eventFromCard', {
        eventType: command,
        id: id.value,
      });
    }
  } else if (command === 'destroy-group') {
    // 添加确认对话框
    if (confirm('确定要解散该群聊吗？解散后所有成员将被移出群聊。')) {
      emit('eventFromCard', {
        eventType: command,
        id: id.value,
      });
    }
  } else if (command === 'agree' || command === 'disagree' || command === 'ignore') {
    let changedState = 'pending';
    switch (command) {
      case 'agree': {
        changedState = 'accepted';
        break;
      }
      case 'disagree': {
        changedState = 'rejected';
        break;
      }
      case 'ignore': {
        changedState = 'ignored';
        break;
      }
      default:
        break;
    }

    try {
      if (props.requestType === 'friendRequest') {
        friendRequests.value[index.value].state = changedState;
        chatStore.handleFriendRequest({
          senderId: id.value,
          state: changedState,
        });
      } else if (props.requestType === 'groupRequest') {
        groupRequests.value[index.value].state = changedState;
        chatStore.handleAddGroupRequest({
          groupId: props.item.groupId,
          senderId: id.value,
          state: changedState,
        });
      } else if (props.requestType === 'groupInvite') {
        groupInvites.value[index.value].state = changedState;
        chatStore.handleInviteGroupRequest({
          groupId: props.item.groupId,
          senderId: id.value,
          state: changedState,
        });
      }
    } catch (error) {
      console.error('处理请求时出错:', error);
      // 可以添加错误提示
    }
  } else if (command === 'viewProfile') {
    console.log('viewProfile');
  }
};
</script>

<style scoped>
.menu {
  margin-left: 28px;
  cursor: pointer;
}

/* 移动端菜单适配 */
@media screen and (max-width: 767px) {
  .menu {
    margin-left: 16px;
  }
}

.el-dropdown-menu {
  display: none;
}

.show {
  display: block;
}

.media {
  align-items: center;
  font-family: 'IBM Plex Sans', sans-serif;
}

/* 移动端媒体卡片适配 */
@media screen and (max-width: 767px) {
  .media {
    padding: 12px;
  }
}

.media-body {
  width: 63%;
}

/* 移动端媒体体适配 */
@media screen and (max-width: 767px) {
  .media-body {
    width: 55%;
  }
}

.media-body p {
  width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 移动端段落适配 */
@media screen and (max-width: 767px) {
  .media-body p {
    width: 100%;
    font-size: 12px;
  }
}

.media-body p {
  color: rgb(149, 170, 201);
}

.media-body h6 {
  margin-bottom: 5px;
  width: 200px;
  font-weight: 400;
  font-size: 17px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 移动端标题适配 */
@media screen and (max-width: 767px) {
  .media-body h6 {
    width: 100%;
    font-size: 15px;
    margin-bottom: 3px;
  }
}

.show {
  display: block;
}

.media {
  padding: 16px;
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: space-between;
}

.media .avatar {
  margin-right: 13px;
}

/* 移动端头像适配 */
@media screen and (max-width: 767px) {
  .media .avatar {
    margin-right: 10px;
  }

  :deep(.el-avatar) {
    width: 40px !important;
    height: 40px !important;
  }

  :deep(.el-badge) {
    --el-badge-size: 8px;
  }
}

.el-dropdown-link {
  outline: none;
}

/* 移动端下拉菜单适配 */
@media screen and (max-width: 767px) {
  :deep(.el-dropdown-menu) {
    min-width: 120px;
  }

  :deep(.el-dropdown-menu__item) {
    padding: 8px 12px;
    font-size: 14px;
  }
}

:deep(.el-dropdown-menu__item) {
  --el-dropdown-menuItem-hover-fill: rgba(33, 170, 147, 0.1);
  --el-dropdown-menuItem-hover-color: var(--bs-green);
}

.link {
  color: rgb(85, 85, 85);
}

.link:hover {
  color: var(--bs-green);
}

.link:active {
  color: var(--bs-green);
}
</style>