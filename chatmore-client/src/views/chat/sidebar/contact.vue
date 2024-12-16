<template>
  <div class="sidebar">
    <div class="container">
      <h1>Contact</h1>
    </div>
    <el-input v-model="input" placeholder="搜索">
      <template #prefix>
        <el-icon ><Search /></el-icon>
      </template>
    </el-input>
    <p class="list-name">Friend List</p>
    <el-scrollbar max-height="100%">
      <el-collapse v-model="activeNames" @change="handleChange">
        <el-collapse-item name="1">
          <template #title>
            <h6>Friend</h6>
          </template>
          <ContactCard v-for="item in friendMap" :key="item.id" :item="item" @eventFromCard="handleEvent"/>
        </el-collapse-item>
        <el-collapse-item name="2">
          <template #title>
            <h6>Group</h6>
          </template>
          <ContactCard v-for="item in groupMap" :key="item.id" :item="item" @eventFromCard="handleEvent"/>
        </el-collapse-item>
        <el-collapse-item name="3">
          <template #title>
            <h6>Friend Request</h6>
          </template>
          <ContactCard v-for="(item,index) in friendRequests" :key="item._id" :item="item" :index="index" requestType="friendRequest" @eventFromCard="handleEvent"/>
        </el-collapse-item>
        <el-collapse-item name="4">
          <template #title>
            <h6>Group Request</h6>
          </template>
          <ContactCard v-for="(item,index) in groupRequests" :key="item._id" :item="item" :index="index" requestType="groupRequest" @eventFromCard="handleEvent"/>
        </el-collapse-item>
        <el-collapse-item name="5">
          <template #title>
            <h6>Group Invite</h6>
          </template>
          <ContactCard v-for="(item,index) in groupInvites" :key="item._id" :item="item" :index="index" requestType="groupInvite" @eventFromCard="handleEvent"/>
        </el-collapse-item>
      </el-collapse>
    </el-scrollbar>
  </div>
  <div class="fade" :class="{show:isActive}" @click="back">
    <div class="window" :class="{'show-window':eventType==='updateName'}" @click.stop>
      <h6>修改备注</h6>
      <el-input  ref="nicknameInput" v-model="nickname" placeholder="请输入备注→回车" @keydown.enter="updateNickname"></el-input>
      <p></p>
    </div>
    <div class="window" :class="{'show-window':eventType==='deleteFriend'}" @click.stop>
      <h6>删除好友</h6>
      <div>
        <el-button @click="back">返回</el-button>
        <el-button type="primary" @click="deleteFriend">确认</el-button>
      </div>
    </div>
    <div class="window" :class="{'show-window':eventType==='deleteGroup'}" @click.stop>
      <h6>退出群聊</h6>
      <div>
        <el-button @click="back">返回</el-button>
        <el-button type="primary" @click="deleteGroup">确认</el-button>
      </div>
    </div>
    <div class="window" :class="{'show-window':eventType==='destroyGroup'}" @click.stop>
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
import ChooseList from "@/components/ChooseList.vue";
export default {
name:'contact',
components:{
  ContactCard,ChooseList
}
}
</script>

<script setup lang="ts">
import emitter from "@/utils/emitter";
import { watch,computed, onUnmounted, ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat';

const chatStore=useChatStore()
const {chatMap,friendRequests,groupInvites,groupRequests,personalDetail}=storeToRefs(chatStore)
let friendMap = computed(() => {
  return chatMap.value.filter(item=>item.type==='user')
})
let groupMap = computed(() => {
  return chatMap.value.filter(item=>item.type==='group')
})

let id=ref('')
let activeNames=ref('')
let input=ref('')
let nickname=ref('')
let eventType=ref('')//触发的事件名
let chatType=ref('')//当前操作对象的类型
let isActive=ref(false);//测试中
let nicknameInput=ref()

function updateNickname(){
  if(chatType.value==='user'){
    chatStore.updateFriendNickname({
      friendId:id.value,
      nickname:nickname.value.trim()
    });
    emitter.emit('notice','您已修改好友备注~')
  }else if(chatType.value==='group'){
    chatStore.updateGroupNickname({
      groupId:id.value,
      nickname:nickname.value.trim()
    });
    emitter.emit('notice','您已修改群聊备注~')
  }
  back()
}

function handleEvent(data){
  let event=data.eventType;
  isActive.value=true;
  if(event==='update-nickname'){
    const {chatId,oldNickname,type}=data;
    id.value=chatId;
    nickname.value=oldNickname;
    chatType.value=type;
    eventType.value='updateName'
    nicknameInput.value.focus();
  }else if(event==='delete-friend'){
    id.value=data.id;
    eventType.value='deleteFriend'
  }
  else if(event==='delete-group'){
    id.value=data.id;
    eventType.value='deleteGroup'
  }else if(event==='destroy-group'){
    id.value=data.id;
    eventType.value='destroyGroup'
  }
}

function deleteFriend(){
  chatStore.deleteFriend({
    friendId:id.value,
  });
  isActive.value=false;
}

function deleteGroup(){
  chatStore.deleteGroup({
    groupId:id.value,
  });
  isActive.value=false;
  emitter.emit('notice','您已退出群聊~')
}

function destroyGroup(){
  chatStore.destroyGroup({
    groupId:id.value,
    userId:personalDetail.value._id
  });
  isActive.value=false;
  emitter.emit('notice','您已退出群聊~')
}

function back(){
  isActive.value=false;
}

function handleChange(){
  console.log('handleChange');
}

watch(() => chatMap, (newMap) => {
  friendMap = newMap.filter(item=>item.type==='user')
  groupMap = newMap.filter(item=>item.type==='group')
});

onUnmounted(()=>{
  isActive.value=true;
})
</script>

<style scoped>
.fade{
  display: none;
  position: fixed;
  width: 370px;
  height: 100%;
  background-color: rgba(0,0,0,0.3);
  z-index: 1;
}
.show{
  display: block;
}
.window{
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
.show-window{
  display: flex;
}
.window .el-input{
  width: 200px;
}
.window h6{
  margin-bottom: 15px;
}
.sidebar{
  padding: 24px;
  padding-bottom: 0;
  width: 370px;
  height: 100vh;
  background-color: rgb(243, 242, 239);
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
}
.container{
  height: 50px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.container h1{
  font-size: 28px;
  font-weight: 800;
  color:var(--bs-green);
}
.list-name{
  padding: 10px 20px;
}

:deep(.el-input__wrapper) {
  --el-input-focus-border-color: var(--bs-green);
}
.media{
  margin-bottom: 8px;
  width: 320px;
  background-color: #fff;
  border-radius: 5px;
  border:1px solid transparent;
  box-shadow: 0 .15rem .15rem  rgba(0, 0, 0, 0.075);
}
.media:hover{
  border:1px solid var(--bs-green);
  transition: 0.3s border;
}
.example-showcase .el-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
}
:deep(.el-collapse-item__content){
  padding: 0;
  padding-top: 8px;
}
:deep(.el-collapse-item__wrap){
  background-color: transparent;
}
.el-collapse-item h6{
  margin: 0;
  padding-left: 20px;
}
.el-scrollbar{
  height: 75%;
}
</style>