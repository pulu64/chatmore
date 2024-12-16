<template>
  <div class="window default" v-show="isSelect">
      <el-input v-model="search" style="height:30px;" placeholder="Please input" />
      <div class="list">
        <el-checkbox
          v-model="checkAll"
          :indeterminate="isIndeterminate"
          @change="handleCheckAllChange"
        >
          Check all
        </el-checkbox>
        <el-checkbox-group
          v-model="checked"
          @change="handleCheckedChange"
        >
          <el-scrollbar max-height="340px">
            <el-checkbox v-for="item in data" :key="item" :label="item" :value="item" :disabled="isInclude(item)" :checked="isInclude(item)">
              <div class="media">
                <div class="avatar">
                  <el-badge is-dot class="item" :offset="[-5, 5]" :color="color" badge-style="width:11px;height:11px;">
                    <el-avatar :size="40" :src="`http://127.0.0.1:3000/avatar/${userGather[item].profilePicture}`" alt="Avataaars" />
                  </el-badge>
                </div>
                <div class="media-body">
                    <h6>{{ userGather[item].username }}</h6>
                </div>
              </div>
            </el-checkbox>
                </el-scrollbar>
          </el-checkbox-group>
      </div>
      <div class="buttons">
        <el-button @click="cancel">取消</el-button>
        <el-button color=var(--bs-green) @click="forward">前进</el-button>
      </div>
    </div>
</template>

<script lang="ts">
export default {

}
</script>

<script lang="ts" setup>
import emitter from "@/utils/emitter";
import { watch,computed, onUnmounted, ref } from "vue";
import { useChatStore } from "@/stores/chat";
import { storeToRefs } from "pinia";
import { getGroupMembers } from "../api/modules/group";
const chatStore=useChatStore()
const {userGather,chatMap}=storeToRefs(chatStore)
let props=defineProps(['type','active','data','groupId'])
let eventType=ref('')
let isSelect=ref(false)

let search = ref('')
const checkAll = ref(false)
const isIndeterminate = ref(true)
let checked=ref([])
let data=ref([])
let includes=ref([])//包含之前被选过的item，现在不可以重复选择
let color=ref('var(--bs-green)')

let id=ref('')

watch(props, async (newProps) => {
  //由于一开始就会加载chooselist组件，要防止发送错误路由请求
  if(newProps.active===true){
    if(newProps.type==='buildGroup'){
      eventType.value='build-group'
    }else if(newProps.type==='inviteGroup'){
      eventType.value='invite-group'
      id.value=newProps.groupId;
      let members=await getGroupMembers(id.value);
      includes.value=members.map(item=>item._id.toString())
    }
    isSelect.value=newProps.active;
    data.value=newProps.data
    checked.value=data.value.filter(item=>includes.value.includes(item))
  }
});

const emit=defineEmits(['build-group','invite-group','cancel'])

async function forward(){
  if(eventType.value==='build-group'){
    emit('build-group',checked.value)
  }else if(eventType.value==='invite-group'){
    let temp=checked.value.filter(item=>!includes.value.includes(item))
    emit('invite-group',temp)
  }
  checkAll.value=false;
  checked.value=[]
  isSelect.value=false;
}

const handleCheckAllChange = (val: boolean) => {
  let temp=data.value.filter(item=>includes.value.includes(item))
  checked.value = val ? data.value : temp
  isIndeterminate.value = false
}

const handleCheckedChange = (value: string[]) => {
  const checkedCount = value.length
  checkAll.value = checkedCount === data.value.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < data.value.length
}

const isInclude = (item) => {
  return includes.value.includes(item);
}
function cancel(){
  isSelect.value=false;
  emit('cancel',false)
}
</script>

<style scoped>
.window{
  margin: auto;
  margin-top: 100px;
  background-color: rgb(255,255,255);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
}
.default{
  padding: 35px 40px 40px;
  width: 300px;
  height: 550px;
}
.default h6{
  font-size: 20px;
  font-weight: 800;
  padding: 16px 0;
}
.default .buttons{
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
.media{
  padding-left: 15px;
  align-items: center;
  line-height: 50px;
  font-family: 'IBM Plex Sans', sans-serif;
  display: flex;
  flex-direction: row;
  transition: all 0.3s;
}
.media .avatar{
  margin-right: 13px;
}
.media-body h6{
  margin-bottom: 0;
  font-weight: 400;
  font-size: 14px;
  overflow: hidden;
  text-overflow:ellipsis;
  white-space: nowrap;
}

/* element ui css */

:deep(.el-input__wrapper),:deep(.el-textarea__inner) {
  --el-input-focus-border-color: var(--bs-green);
}
.list{
  width: 235px;
  height: 410px;
}
.el-badge{
  height: 40px;
}
.el-checkbox{
  height: 50px;
  margin-right: 0;
}
.default .el-input{
  width: 220px;
  margin-bottom: 10px;
}
</style>