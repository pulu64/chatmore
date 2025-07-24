<template>
  <li class="media">
    <input type="checkbox" class="checkbox" v-model="selected" @change="handleChange" />
    <div class="avatar">
      <el-badge is-dot class="item" :offset="[-5, 5]" :color="color" badge-style="width:11px;height:11px;">
        <el-avatar :size="40" :src="avatar" alt="Avataaars" />
      </el-badge>
    </div>
    <div class="media-body">
      <h6>{{ chatName }}</h6>
    </div>
  </li>
</template>

<script lang="ts">
export default {
  name: 'ChooseCard',
};
</script>

<script setup lang="ts">
import { watch, computed, ref } from 'vue';
import { useChatStore } from '../stores/chat';
import { storeToRefs } from 'pinia';
import { SERVER_URL } from '@/api/index';

const chatStore = useChatStore();
const { userGather, friendGather } = storeToRefs(chatStore);
const props = defineProps(['item']);
let { id, type, timestamp } = props.item;

//处理复选框数据
let selected = ref(false);
const emit = defineEmits(['update:selected']);
const handleChange = () => {
  emit('update:selected', props.item.id, selected.value);
};

//初始化展示数据

//判定聊天对象信息,得到data，继续初始化剩余数据。
let name = ref('');
let avatar = ref('');
let profilePicture = ref('');
let nickname = ref('');
let chatName = ref('');
let color = ref('');

const COLOR_ONLINE = 'var(--bs-green)';
const COLOR_OFFLINE = '#ff4d4f';
const COLOR_BUSY = 'var(--bs-yellow)';

//初始化展示数据
const data = computed(() => {
  if (type === 'user') {
    return {
      user: userGather.value[props.item.id],
      friend: friendGather.value[props.item.id],
    };
  } else if (type === 'group') {
    return chatStore.groupGather[id];
  }
  return null;
});

// 监听 data 的变化，更新 nickname
watch(
  data,
  (newData) => {
    if (newData) {
      //名称
      name.value = type === 'user' ? newData.user.username : newData.groupName;
      nickname.value = type === 'user' ? newData.friend.nickname : newData.groupNickname;
      profilePicture.value = type === 'user' ? newData.user.profilePicture : newData.groupPicture;
      avatar.value = `${SERVER_URL}/avatar/${profilePicture.value}`;
      if (typeof nickname.value !== 'undefined' && nickname.value != '') {
        chatName.value = `${name.value}(${nickname.value})`;
      } else {
        chatName.value = name.value;
      }
      if (type === 'user') {
        if (newData.user.state === 'active') color.value = COLOR_ONLINE;
        else if (newData.user.state === 'busy') color.value = COLOR_BUSY;
        else if (newData.user.state === 'offline') color.value = COLOR_OFFLINE;
        else color.value = COLOR_OFFLINE;
      } else {
        color.value = COLOR_ONLINE;
      }
    } else {
      name.value = '';
      nickname.value = '';
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.media {
  width: 230px;
  align-items: center;
  font-family: 'IBM Plex Sans', sans-serif;
  padding: 0 16px;
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