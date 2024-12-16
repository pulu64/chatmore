<template>
  <div class="media">
    <div class="avatar">
      <el-badge :is-dot="type==='user'" :offset="[-6, 6]" :color="color" badge-style="width:11px;height:11px;">
        <el-avatar :size="50" :src="`http://127.0.0.1:3000/avatar/${avatar}`" alt="Avataaars" />
      </el-badge>
    </div>
    <div class="media-body">
        <h6>
          <RouterLink :to="{ name: 'profile', query: { id,type } }" class="link">{{chatName }}</RouterLink>
        </h6>
        <p v-if="isRequest&&requestType==='groupRequest'">申请加入群：{{ requestGroupName }}</p>
        <p>{{ info }}</p>
    </div>
    <p v-if="state===1">已同意</p>
    <p v-if="state===2">已拒绝</p>
    <p v-if="state===3">已忽视</p>
    <div class="menu" v-show="!(isRequest&&state!==0)">
      <el-dropdown @command="handleCommand">
        <span class="el-dropdown-link">
          <el-icon><MoreFilled /></el-icon>
        </span>
        <template #dropdown >
          <el-dropdown-menu :class="{show:!isRequest}">
            <el-dropdown-item command="viewProfile">
              <RouterLink :to="{ name: 'profile', query: { id,type } }">
                查看资料
              </RouterLink>
            </el-dropdown-item>
            <el-dropdown-item command="update-nickname">修改备注</el-dropdown-item>
            <el-dropdown-item command="delete-friend" v-if="type==='user'">删除好友</el-dropdown-item>
            <el-dropdown-item command="delete-group" v-if="type==='group'&&role!=='owner'">退出群聊</el-dropdown-item>
            <el-dropdown-item command="destroy-group" v-if="type==='group'&&role==='owner'">解散群聊</el-dropdown-item>
          </el-dropdown-menu>
          <el-dropdown-menu :class="{show:isRequest}">
            <el-dropdown-item command="agree">同意</el-dropdown-item>
            <el-dropdown-item command="disagree">拒绝</el-dropdown-item>
            <el-dropdown-item command="ignore">忽视</el-dropdown-item>
            <el-dropdown-item command="viewProfile">
              <RouterLink :to="{ name: 'profile', query: { id,type } }">
                查看资料
              </RouterLink>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name:'ContactCard'
  }
</script>

<script setup lang="ts">
import { watch, ref, toRef, computed } from 'vue';
import { useChatStore } from '../stores/chat';
import { storeToRefs } from 'pinia';
import { differenceInCalendarDays, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { request } from 'http';
import { getGroupProfile } from '../api/modules/group';
const chatStore=useChatStore()
const{friendRequests,groupRequests,groupInvites}=storeToRefs(chatStore);
const {handleFriendRequest,handleAddGroupRequest,handleInviteGroupRequest}=chatStore
const {userGather,friendGather,groupGather}=storeToRefs(chatStore)
const props=defineProps(['item','index','requestType'])
let state=toRef(props.item,'state');
let index=toRef(props.index,'state');
let isRequest=ref(false);

//初始化展示数据
let id=ref('')
let type=ref('')
let role=ref('')
let color=ref('var(--bs-green)')
let name=ref('');
let requestType=ref('')
let requestGroupName=ref('')
let nickname=ref('');
let chatName=ref('')
let avatar=ref('');
let info=ref('')

//初始化展示数据
const data = computed(() => {
  if(props.item.type==="user"){
    return {
      user:userGather.value[props.item.id],
      friend:friendGather.value[props.item.id]
    }
  }else if(props.item.type==="group"){
    return chatStore.groupGather[props.item.id];
  }else{
    return chatStore.userGather[props.item.senderId.toString()]
  }
});

// 监听 data 的变化，更新 nickname
watch(data, async (newData,oldData) => {
  if (newData) {
    //名称
    isRequest.value=false;
    type.value=props.item.type;
    if(props.item.type==="user"||props.item.type==="group"){
      id.value=props.item.id;
      name.value = type.value === "user" ? newData.user.username : newData.groupName;
      nickname.value = type.value === "user" ? newData.friend.nickname : newData.groupNickname;
      avatar.value= type.value === "user" ? newData.user.profilePicture : newData.groupPicture;
      info.value = type.value === "user" ? newData.user.signature : newData.groupDescription
      if(type.value === "user"){
        newData.user.state==="active"?color.value='var(--bs-green)':color.value='var(--bs-red)'
      }else if(type.value==='group'){
        role.value=newData.role;
      }
      if(typeof nickname.value !=='undefined' && nickname.value!=''){
        chatName.value=`${name.value}(${nickname.value})`
      }else{
        chatName.value=name.value;
      }
    }else{
      //request
      isRequest.value=true;
      id=computed(() => props.item.senderId);
      chatName =computed(() => userGather.value[id.value].username);
      avatar= computed(() => userGather.value[id.value].profilePicture);
      state=computed(() => props.item.state);
      requestType=computed(() => props.requestType);
      if(requestType.value==='groupRequest'){
        info = computed(() => props.item.requestMessage);
        requestGroupName=computed(() => groupGather.value[props.item.groupId].groupName);
      }
      if(requestType.value==='groupInvite'){
        const result=await getGroupProfile(props.item.groupId);
        info.value=`邀请你加入${result.groupName}`
      }
    }
  }
}, { immediate: true ,deep:true});

const emit=defineEmits(['eventFromCard'])

const handleCommand = (command: string | number | object) => {
  if(command==='update-nickname'){
    emit('eventFromCard',{
      eventType:command,
      chatId:props.item.id,
      type:type.value,
      oldNickname:nickname.value,
    });
  }else if(command==='delete-friend'){
    emit('eventFromCard',{
      eventType:command,
      id:id.value
    });
  }else if(command==='delete-group'){
    emit('eventFromCard',{
      eventType:command,
      id:id.value
    })
  }else if(command==='destroy-group'){
    emit('eventFromCard',{
      eventType:command,
      id:id.value
    })
  }
  else if(command==='agree'||command==='disagree'||command==='ignore'){
    let changedState=0;
    switch(command){
      case 'agree':{
        changedState=1;break;
      }
      case 'disagree':{
        changedState=2;break;
      }
      case 'ignore':{
        changedState=3;break;
      }
      default:break;
    }
    if(requestType.value==='friendRequest'){
      friendRequests.value[index.value].state=changedState;
      handleFriendRequest({
        senderId:id.value,
        state:changedState
      })
    }else if(requestType.value==='groupRequest'){
      groupRequests.value[index.value].state=changedState;
      handleAddGroupRequest({
        groupId:props.item.groupId,
        senderId:id.value,
        state:changedState
      })
    }else if(requestType.value==='groupInvite'){
      groupInvites.value[index.value].state=changedState;
      handleInviteGroupRequest({
        groupId:props.item.groupId,
        senderId:id.value,
        state:changedState
      })
    }
  }else if(command==='viewProfile'){
    console.log('viewProfile');
    
  }
}
</script>

<style scoped>
.menu{
  margin-left: 28px;
  cursor: pointer;
}
.el-dropdown-menu{
  display: none;
}
.show{
  display: block;
}
.media{
  align-items: center;
  font-family: 'IBM Plex Sans', sans-serif;
}

.media-body{
  width: 63%;
}
.media-body p{
  width: 180px;
  overflow: hidden;
  text-overflow:ellipsis;
  white-space: nowrap;
}
.media-body p{
  color:rgb(149, 170, 201);
}
.media-body h6{
  margin-bottom: 5px;
  width: 200px;
  font-weight: 400;
  font-size: 17px;
  overflow: hidden;
  text-overflow:ellipsis;
  white-space: nowrap;
}

.show{
  display: block;
}
.media{
  padding: 16px;
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: space-between;
}
.media .avatar{
  margin-right: 13px;
}

.el-dropdown-link{
  outline:none;
}
:deep(.el-dropdown-menu__item){
  --el-dropdown-menuItem-hover-fill:rgba(33,170,147,0.1);
  --el-dropdown-menuItem-hover-color:var(--bs-green);
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