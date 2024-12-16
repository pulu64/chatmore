<template>
  <li class="media" @click="openChatRoom">
    <div class="avatar">
      <RouterLink :to="{ name: 'profile', query: { id,type } }" class="link" @click.stop>
        <el-badge :is-dot="type==='user'" :offset="[-6, 6]" :color="color" badge-style="width:11px;height:11px;">
          <el-avatar :size="50" :src="`http://127.0.0.1:3000/avatar/${avatar}`" alt="Avataaars" />
        </el-badge>
      </RouterLink>
    </div>
    <div class="media-body">
      <div class="info"><h6>{{chatName }}</h6><p>{{ time }}</p></div>
      <div class="text-context"><p>{{message}}</p><div class="unread" :class="{show:isActive}">{{ unread }}</div></div>
    </div>
  </li>
</template>

<script lang="ts">
  export default {
    name:'ChatCard'
  }
</script>

<script setup lang="ts">
import { watch, ref, computed } from 'vue';
import { useChatStore } from '../stores/chat';
import { storeToRefs } from 'pinia';
import { differenceInCalendarDays, format } from 'date-fns';
import { getGroupSendersDetail,getGroupAdmins } from '@/api/modules/group';
import { zhCN } from 'date-fns/locale';
import emitter from '@/utils/emitter';
import { getGroupMembers } from '../api/modules/group';

const chatStore=useChatStore()
const {groupGather,messageGather,userGather,friendGather,chatMap}=storeToRefs(chatStore)
const {personalDetail}=chatStore
const props=defineProps(['item'])
let {id,type,timestamp}=props.item;

//信息
let name=ref('')
let nickname=ref('')
let chatName=ref('')
let message=ref('你们已经是好友啦，快来聊天吧~')
let avatar=ref('')

//在线状态
let color=ref('var(--bs-green)')

//信息+未读信息提醒
let unread=ref(0)
let isActive=ref(false)//测试中
if(chatStore.messageGather[id].length!==0){
  message.value=messageGather.value[id].at(-1).messageText
}

//最新消息时间
let time=ref('')
const now =new Date()
if(!(timestamp instanceof Date)){
  timestamp=new Date(timestamp)
}
const diffInDays=differenceInCalendarDays(now,timestamp)
if(diffInDays===0){
  time.value= format(timestamp, 'p', { locale: zhCN });
}else if(diffInDays===1){
  time.value= '昨天';
}else{
  time.value= format(timestamp, 'yyyy/MM/dd', { locale: zhCN });
}

//初始化展示数据
const data = computed(() => {
  if(type==="user"){
    return {
      user:userGather.value[id],
      friend:friendGather.value[id]
    }
  }else if(type==="group"){
    return groupGather.value[id];
  }
  return null;
});

async function openChatRoom(){
  if(type==='group'){
      //收集群成员和（已经退群的消息发送者）的信息
      const members= await getGroupMembers(id);
      const senders = await getGroupSendersDetail(id);
      members.forEach(item=>{
        if(typeof userGather.value[item._id]==='undefined'){
          const {_id,username,state,signature,profilePicture}=item;
          userGather.value[item._id]={_id,username,state,signature,profilePicture};
        }
      })
      senders.forEach(item=>{
        if(typeof userGather.value[item._id]==='undefined'){
          const {_id,username,state,signature,profilePicture}=item;
          userGather.value[item._id]={_id,username,state,signature,profilePicture};
        }
      })
  }
  emit('idFromCard',id,chatName,type);
}

// 监听 data 的变化
watch(data, (newData) => {
  if (newData) {
    //名称
    name.value = type === "user" ? newData.user.username : newData.groupName;
    nickname.value = type === "user" ? newData.friend.nickname : newData.groupNickname;
    avatar.value = type === "user" ? newData.user.profilePicture : newData.groupPicture;
    if(nickname.value!=''){
      chatName.value=`${name.value}(${nickname.value})`
    }else{
      chatName.value=name.value;
    }
    //在线状态变更
    if(type==='user'){
      if(newData.user.state==="active")
        color.value='var(--bs-green)'
      else if(newData.user.state==="busy"){
        color.value='var(--bs-yellow)'
      }else if(newData.user.state==="offline"){
        color.value='#b1b1b1'
      }
    }
    
  } else {
    name.value=''
    nickname.value = '';
  }
}, { immediate: true ,deep:true});

watch(
  () => {
    if (id && chatStore.messageGather[id] && Array.isArray(chatStore.messageGather[id])) {
      return {
        id:chatStore.messageGather[id].at(-1)?.senderId,
        message:chatStore.messageGather[id].at(-1)?.messageText
      }
    }
    return '';
  },
  (newMessage) => {
    if (newMessage) { 
      // 刷新聊天列表
      const index = chatMap.value.findIndex(item => item.id === id);
      const item = chatMap.value.splice(index, 1)[0];
      item.timestamp = new Date();
      chatMap.value.unshift(item);
      message.value = newMessage.message;
      time.value=format(item.timestamp, 'p', { locale: zhCN });
    }
  });

const emit=defineEmits(['idFromCard'])
</script>

<style scoped>
.media{
  align-items: center;
  font-family: 'IBM Plex Sans', sans-serif;
}

.media-body{
  width: 80%;
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.media-body p{
  overflow: hidden;
  text-overflow:ellipsis;
  white-space: nowrap;
}
.info{
  padding: 2px 0 3px 0;
  width: 220px;
  color:rgb(85,85,85);
  display: flex;
  justify-content: space-between;
}
.info p{
  flex-shrink: 0;
  color:rgb(149, 170, 201);
}
.info h6{
  margin-bottom: 0;
  margin-right: 10px;
  font-weight: 400;
  font-size: 17px;
  overflow: hidden;
  text-overflow:ellipsis;
  white-space: nowrap;
}
.text-context{
  padding-top: 3px;
  width: 220px;
  display: flex;
  justify-content: space-between;
}
.text-context p{
  overflow: hidden;
  margin-right: 10px;
  text-overflow:ellipsis;
  white-space: nowrap;
}

.unread{
  width: 20px;
  height: 20px;
  background-color: rgb(149, 170, 201);
  border-radius: 100%;
  text-align: center;
  line-height: 20px;
  color: white;
  font-size: 14px;
  margin-right: 7px;
  flex-shrink: 0;
  display: none;
}
.show{
  display: block;
}
.media{
  padding: 16px;
  display: flex;
  flex-direction: row;
  align-content: center;
}
.media .avatar{
  margin-right: 13px;
}
.link{
  color:rgb(85,85,85)
}
.link:hover{
  color :var(--bs-green)
}
.link:active{
  color :var(--bs-green)
}
</style>