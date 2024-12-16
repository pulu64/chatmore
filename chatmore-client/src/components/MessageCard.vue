<template>
  <div class="message" :class="{right:isSender}">
    <RouterLink :to="{ name: 'profile', query: { id,type:'user' } }" class="link" @click.stop>
      <el-avatar :size="30" :src="avatar"/>
    </RouterLink>
    <ul class="message-body">
      <li class="message-item">
        <span class="date">
          <el-tag size="small" type="warning" v-if="role==='owner'">群主</el-tag>
          <el-tag size="small" v-if="role==='admin'">管理员</el-tag>
          <el-tag size="small" v-if="role==='normal'" effect="plain">群成员</el-tag>
          <span>{{ username }}</span>
          <i>{{ time }}</i>
        </span>
        <div v-if="messageType===0" class="message-content">{{ messageText }}</div>
        <div v-if="messageType===1" class="message-content chat-img">
          <el-image
            style="width: 200px; height: 200px"
            :src="messageText"
            :zoom-rate="1.2"
            :max-scale="7"
            :min-scale="0.2"
            :preview-src-list="srcList"
            :initial-index="0"
            fit="cover"
          />
        </div>
        <div v-if="messageType===2" class="message-content file">
          <img src="../assets/fileImg/pdf.png" alt="">
          <div class="word">
            <h4>测试.pdf</h4>
            <p>154kb</p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
export default {
name:'MessageCard'
}
</script>

<script setup lang="ts">
import { watch,computed, ref,toRefs } from 'vue';
import { useChatStore } from '../stores/chat';
import { storeToRefs } from 'pinia';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { group } from 'console';
const chatStore=useChatStore()
const {userGather,personalDetail,groupGather}=storeToRefs(chatStore)
const props=defineProps(['item','userId','type'])
const { item } = toRefs(props);

let id=ref(item.value.senderId)
let username=ref('用户已注销')
let avatar=ref('')
let myId=ref(personalDetail.value._id)
let role=ref('')
let sender=userGather.value[item.value.senderId]
let isSelf=ref(myId.value===item.value.senderId);

if(isSelf.value){
  username.value=personalDetail.value.username;
  avatar.value=`http://127.0.0.1:3000/avatar/${personalDetail.value.profilePicture}`
}else{
  if(typeof sender!=='undefined'){
    username.value=sender.username 
    avatar.value=`http://127.0.0.1:3000/avatar/${sender.profilePicture}`
  }
}

//如果群成员身份发生变化，更新role
watch(()=>{
  if(props.type==='group'){
    return groupGather.value[props.item.groupId]?.adminMap;
  }else {
    return null
  }
},(newAdminMap)=>{
  if(newAdminMap)
  role.value=newAdminMap.get(props.item.senderId);
  if(typeof role.value==='undefined'){
    role.value='normal';
  }
},{immediate:true,deep:true})

let messageType=ref(item.value.type)
let messageText=ref(item.value.messageText)
let time=ref('')
let timestamp=new Date(item.value.timestamp)
time.value=format(timestamp, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
let isSender=isSelf.value?true:false

let srcList = []

if(messageType.value===1){
  messageText.value=`http://127.0.0.1:3000/image/${messageText.value}`
  srcList[0]=messageText.value
}

</script>
<style scoped>
.message{
  display: flex;
  flex-direction: row;
  justify-content: start;
}
.right{
  justify-content: flex-end;
}
.link{
  height: 30px;
}
.el-avatar{
  margin-right: 10px;
}
.right .link{
  order:1;
}
.right .el-avatar{
  margin-left: 10px;
}
.message-content{
  padding: 16px;
  max-width:400px;
  margin-bottom: 10px;
  border-radius: 15px;
  background-color: rgb(245, 245, 245);
}
.message-content{
  border-top-left-radius: 0;
}
.right .message-content{
  border-top-left-radius: 15px;
  border-top-right-radius: 0;
}
.message-item {
  display: flex;
  flex-direction: column;
}
.message-body{
  padding: 0;
}
.message-item{
  align-items: flex-start; 
  }
.right .message-item{
align-items: flex-end; 
}
.date {
  color:rgb(149, 170, 201);
  margin-bottom: 8px;
}
.date span{
  margin: 2px;
}
.date i{
  margin: 0 5px;
  display: none;
}
.right .date i{
  float: left;
}
.message-item:hover i{
  display: inline;
}
.chat-img .el-image{
  border-radius: 8px;
}
.file{
  cursor: pointer;
  display: flex;
  align-items: center;
}
.file img{
  width: 50px; height: 50px;
  margin-right: 5px;
  
}
.file h4{
  display: inline-block;
}
.file p{
  color:rgb(149, 170, 201);
}
</style>