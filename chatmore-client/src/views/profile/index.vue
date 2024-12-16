<template>
  <div class="user-page">
    <sidebar :result="result" :type="type"></sidebar>
    <div class="setting">
      <el-container>
        <el-header>
          <el-space class="setting-header" direction="vertical" alignment="flex-start" >
            <h3>Settings</h3>
            <p>Last Update your profile:29 Aug 2020</p>
          </el-space>
        </el-header>
        <el-scrollbar :max-height="'calc(100vh - 100px)'">
          <div class="content" v-show="personalDetail._id!==id">
            <ShowProfile :result="result" :type="type"></ShowProfile>
          </div>
          <div class="content" v-show="personalDetail._id===id">
            <UpdateUser></UpdateUser>
          </div>
          <div class="content" v-show="canUpdate">
            <UpdateGroup :result="result" :type="type"></UpdateGroup>
          </div>
          </el-scrollbar>
      </el-container>
    </div>
  </div>

</template>

<script lang="ts">
import { getUserProfile } from '@/api/modules/user';
import { getGroupProfile } from '@/api/modules/group';
import ShowProfile from './show-profile.vue';
import sidebar from './sidebar.vue';
import UpdateUser from './update-user.vue';
import { aL } from 'vitest/dist/reporters-yx5ZTtEV';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import UpdateGroup from './update-group.vue';
export default {
  name:'index',
  components:{
    sidebar,UpdateUser,ShowProfile,UpdateGroup
  }
};
</script>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
const chatStore = useChatStore()
const {personalDetail,groupGather} =storeToRefs(chatStore)
let result=ref(null);
// 获取当前路由对象

const route = useRoute();
const {id,type}=route.query

const canUpdate =computed(()=>{
  if(type==='group'&&id.toString() in groupGather.value){
    return groupGather.value[id.toString()].adminMap.get(personalDetail.value._id)
  }
})

// 在组件挂载后执行异步操作
onMounted(async () => {
  try {
    if(type==='user'||type==='request'){
      result.value = await getUserProfile(id.toString());
    }else if(type==='group'){
      result.value = await getGroupProfile(id.toString())
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
});
</script>

<style scoped>

.setting-header{
  margin-top:16px;
}
.user-page{
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: row;
}
.el-header{
  height: 90px;
  padding-left: 40px;
  border-bottom: 1.5px solid rgb(243, 242, 239);
}
.setting{
  padding-left: 40px;
  flex-grow:1;
  height: 100vh;
}
</style>