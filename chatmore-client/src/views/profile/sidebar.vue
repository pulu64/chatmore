<template>
    <div class="sidebar">
      <div class="container">
        <h1>Profile</h1>
        <el-button v-if="personalDetail._id===route.query.id.toString()" @click="signout">退出登录</el-button>
      </div>
      <el-input v-model="input" placeholder="搜索">
        <template #prefix>
          <el-icon ><Search /></el-icon>
        </template>
      </el-input>
      <p class="list-name">Show Area</p>  
      <li class="media">
          <el-avatar shape="square" :size="160" :src="avatar" />
          <h2>{{ name }}</h2>
          <span>[email protected]</span>
        </li>
      <li class="media">
        <h4>个性签名</h4>
        <span>{{ info }}</span>
      </li>
  </div>
</template>

<script lang="ts">
export default {
  name:'index'
}
</script>

<script setup lang="ts">
import Cookies from 'js-cookie';
import { watch,computed, ref, onMounted } from 'vue';
import { getUserProfile } from '@/api/modules/user';
import { getGroupProfile } from '@/api/modules/group';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import { storeToRefs } from 'pinia';
const router = useRouter();
const route = useRoute();
let props=defineProps(['result','type'])
const chatStore =useChatStore()
const {disconnect} =chatStore;
const {personalDetail}=storeToRefs(chatStore)

let id=ref('')
let input=ref('')
let name=ref('')
let email=ref('')
let phone=ref('')
let gender=ref('')
let info=ref('')
let avatar=ref('')

watch(() => {
  if(typeof props.result!=='undefined'){
    return props.result
  }else{
    id.value=personalDetail.value._id
    name.value=personalDetail.value.username
    email.value=personalDetail.value.email
    phone.value=personalDetail.value.phone
    gender.value=personalDetail.value.gender
    info.value=personalDetail.value.signature
    avatar.value=`http://127.0.0.1:3000/avatar/${personalDetail.value.profilePicture}`
  }
}, (newResult) => {
  if(props.type==='user'){
    id.value=route.query.id.toString()
    name.value=newResult.username
    avatar.value=`http://127.0.0.1:3000/avatar/${newResult.profilePicture}`
    gender.value=newResult.gender
    phone.value=newResult.phone
    info.value=newResult.signature
  }else if(props.type==='group'){
    id.value=route.query.id.toString()
    name.value=newResult.groupName
    gender.value=newResult.gender
    info.value=newResult.groupDescription
    avatar.value=newResult.groupPicture
  }
},{deep:true})


async function signout(){
  await router.push('/signin');
  Cookies.remove('token');
  disconnect()
}
</script>

<style scoped>

.list-name{
  padding: 10px 20px;
}
.sidebar{
  padding: 24px;
  width: 370px;
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
:deep(.el-input__wrapper) {
  --el-input-focus-border-color: var(--bs-green);
}
.media{
  padding: 40px 30px;
  margin-bottom: 10px;
  width: 320px;
  background-color: #fff;
  border-radius: 5px;
  border:1px solid transparent;
  box-shadow: 0 .15rem .15rem  rgba(0, 0, 0, 0.075);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.media span{
  text-align: center;
}
.media h2{
  text-align: center;
}
.el-avatar {
  border-radius: 160px;
  margin-bottom: 20px;
  outline:2px solid rgba(0, 0, 0, 0.075);
}
</style>