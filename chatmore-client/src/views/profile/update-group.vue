<template>
  <div class="show-window">
    <el-form :model="form"
    label-width="auto"
    style="max-width: 600px"
    :disabled="isDisabled"
    size="large">
      <el-form-item label="群昵称">
        <el-input v-model="form.groupName" :placeholder="form.groupName"/>
      </el-form-item>
      <el-form-item label="群介绍">
        <el-input v-model="form.groupDescription" type="textarea" :placeholder="form.groupDescription"/>
        <el-button @click="updateGroupProfile">更新资料</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
export default {
  username:'update-group'
}
</script>

<script setup lang="ts">
import { watch,ref,reactive, computed } from 'vue'
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
const chatStore =useChatStore()
import { useRoute } from 'vue-router';
const {updateUserProfile} =chatStore
const route = useRoute();
const {id,type}=route.query
let isDisabled=ref(false)
let createdAt=ref('')
let email=ref('')

const form = reactive({
  groupName: '',
  groupDescription: '',
})

const data = computed(() => {
  return chatStore.groupGather[id.toString()];
});

watch(data, (newData) => {
  if (newData) {
    //名称
    form.groupName=newData.groupName;
    form.groupDescription=newData.groupDescription;
  }
}, { immediate: true ,deep:true});

function updateGroupProfile() {
  chatStore.updateGroupProfile({
    groupId:id.toString(),
    data:form
  })
}
</script>

<style scoped>
.show-window{
  padding-left: 40px;
}
.el-form-item label{
  font-size: 16px;
}
:deep(.el-form-item__content){
  flex-wrap: nowrap;
}
.el-button{
  margin-left: 20px;
}
</style>