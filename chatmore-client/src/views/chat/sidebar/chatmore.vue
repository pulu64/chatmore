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
          <el-dropdown-menu >
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
        <el-icon ><Search /></el-icon>
      </template>
    </el-input>
    <p class="list-name">RECENT CHATS</p>
    <el-scrollbar max-height="100%">
      <ul class="alist">
        <ChatCard @idFromCard="handleId" v-for="item in filteredChatMap" :key="item.id" :item="item"/>
      </ul>
    </el-scrollbar>
  </div>
  <div :class="{fade:isActive}">
    <ChooseList 
    type="buildGroup" 
    :active="isChooseActive" 
    :data="friendMap"
    @build-group="getArr"
    @cancel="handleCancel"></ChooseList>
    <div class="window small" v-show="isBuildGroup&&isActive">
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
import ChooseList from "@/components/ChooseList.vue";
export default {
  name:'chat-list',
  components:{
    ChatCard,ChooseList
  }
}
</script>

<script setup lang="ts">
import emitter from "@/utils/emitter";
import { ElMessage } from 'element-plus'
import { watch,computed, onUnmounted, ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia';
import { useChatStore } from '@/stores/chat';
const chatStore=useChatStore()
let {chatMap,userGather,groupGather}=storeToRefs(chatStore)
const {createGroup}=chatStore
let filteredChatMap=ref(chatStore.chatMap)

const friendMap = computed(() => {
  const friends = chatMap.value.filter(item=>{
    return item.type==='user'
  })
  return friends.map(item=>item.id.toString())
})

let isActive=ref(false)
let isChooseActive=ref(false)
let isBuildGroup=ref(false)
let inputGroupName=ref('')
let inputGroupDescription=ref('')
let data=ref({
  groupName:'',
  groupDescription:'',
  members:[]
})

let search=ref();
const handleCommand = (command: string | number | object) => {
  if(command==='choose'){
    isActive.value=true;
    isChooseActive.value=true;
  }else if(command==='search'){
    emitter.emit('search',2)
  }
}

//提交建群申请
function getArr(arr){
  data.value.members=arr
  isBuildGroup.value=true;
  isChooseActive.value=false;
}

function back(){
  isBuildGroup.value=false;
  isChooseActive.value=true;
}

function handleCancel(){
  isActive.value=false;
  isChooseActive.value=false;
}

async function buildGroup(){
  if(inputGroupName.value&&inputGroupDescription.value){
    data.value.groupName=inputGroupName.value,
    data.value.groupDescription=inputGroupDescription.value,
    chatStore.createGroup(data.value)
    isActive.value=false;
    isBuildGroup.value=false;
    emitter.emit('notice','您已建立新群聊~')
  }else if(!inputGroupName.value){
    ElMessage.warning('群名称不能为空！')
  }else if(!inputGroupDescription.value){
    ElMessage.warning('群介绍不能为空！')
  }
}

watch(search,(newTerm)=>{
  const temp = chatMap.value.filter(item=>{
    if(item.type==='user'){
      return userGather.value[item.id].username.toLowerCase().includes(newTerm.toLowerCase());
      /* userGather.value[item.id].email.includes(search.value); */
    }else if(item.type==='group'){
      return groupGather.value[item.id].groupName.toLowerCase().includes(newTerm.toLowerCase());
    }
  })
  filteredChatMap.value=temp;
})

watch(chatMap,(newChatMap)=>{
  if(typeof search.value==='undefined'||search.value===''){
    filteredChatMap.value=newChatMap;
  }
})

//打开聊天页面
const emit=defineEmits(['idFromList'])
function handleId(id,chatName,type){
  emit('idFromList',id,chatName,type)
}
</script>

<style scoped>
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
  margin-bottom: 8px;;
  width: 320px;
  background-color: #fff;
  border-radius: 5px;
  border:1px solid transparent;
  box-shadow: 0 .15rem .15rem  rgba(0, 0, 0, 0.075);
}
.media:hover{
  border:1px solid var(--bs-green);
  cursor: pointer;
  transition: 0.3s border;
}
.example-showcase .el-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  
}
.el-dropdown-link{
  outline:none;
}
:deep(.el-dropdown-menu__item){
  --el-dropdown-menuItem-hover-fill:rgba(33,170,147,0.1);
  --el-dropdown-menuItem-hover-color:var(--bs-green);
}
.el-scrollbar{
  height: 75%;
}

.fade{
  position: fixed;
  width: 370px;
  height: 100%;
  background-color: rgb(0, 0, 0,0.4);
  z-index: 1;
}
.window{
  margin: auto;
  margin-top: 100px;
  background-color: rgb(255,255,255);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
}
.small{
  margin-top: 200px;
  padding: 20px 40px;
  width: 280px;
  height: 320px;
  align-items: center;
}
.small h6{
  font-size: 20px;
  font-weight: 800;
  color:var(--bs-green);
  padding-top:16px;
  margin-bottom: 5px;
}
.small p{
  padding: 10px 0;
}
.small .buttons{
  margin-top: 23px;
}
.small .el-input{
  width: 200px;
}
</style>