<template>
  <div class="window default" v-show="isSelect">
    <el-input v-model="search" style="height: 30px" placeholder="搜索用户">
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <div class="list">
      <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange"> Check all </el-checkbox>
      <el-checkbox-group v-model="checked" @change="handleCheckedChange">
        <el-scrollbar max-height="340px">
          <el-checkbox
            v-for="item in filteredData"
            :key="item"
            :label="item"
            :value="item"
            :disabled="isInclude(item)"
            :checked="isInclude(item)"
          >
            <div class="media">
              <div class="avatar">
                <el-badge is-dot class="item" :offset="[-5, 5]" :color="badgeColor(item)" badge-style="width:11px;height:11px;">
                  <el-avatar :size="40" :src="`${SERVER_URL}/avatar/${userGather[item].profilePicture}`" alt="Avataaars" />
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
      <el-button color="var(--bs-green)" @click="forward">前进</el-button>
    </div>
  </div>
</template>

<script lang="ts">
export default {};
</script>

<script lang="ts" setup>
import emitter from '@/utils/emitter';
import { watch, computed, onUnmounted, ref } from 'vue';
import { useChatStore } from '@/stores/chat';
import { storeToRefs } from 'pinia';
import { getGroupMembers } from '../api/modules/group';
import { SERVER_URL } from '@/api/index';
import { Search } from '@element-plus/icons-vue';
const chatStore = useChatStore();
const { userGather, chatMap } = storeToRefs(chatStore);
let props = defineProps(['type', 'active', 'data', 'groupId']);
let eventType = ref('');
let isSelect = ref(false);

let search = ref('');
const checkAll = ref(false);
const isIndeterminate = ref(true);
let checked = ref([]);
let propsData = ref([]); // 重命名避免与 props.data 冲突
let includes = ref([]); //包含之前被选过的item，现在不可以重复选择
let color = ref('var(--bs-green)');

let id = ref('');

const COLOR_ONLINE = 'var(--bs-green)';
const COLOR_OFFLINE = '#ff4d4f';
const COLOR_BUSY = 'var(--bs-yellow)';

function badgeColor(item) {
  const user = userGather.value[item];
  if (user) {
    if (user.state === 'active') return COLOR_ONLINE;
    if (user.state === 'busy') return COLOR_BUSY;
    if (user.state === 'offline') return COLOR_OFFLINE;
  }
  return COLOR_OFFLINE;
}

watch(props, async (newProps) => {
  //由于一开始就会加载chooselist组件，要防止发送错误路由请求
  if (newProps.active === true) {
    console.log('ChooseList props:', newProps); // 调试信息
    if (newProps.type === 'buildGroup') {
      eventType.value = 'build-group';
    } else if (newProps.type === 'inviteGroup') {
      eventType.value = 'invite-group';
      id.value = newProps.groupId;
      let members = await getGroupMembers(id.value);
      includes.value = members.map((item) => item._id.toString());
    }
    isSelect.value = newProps.active;
    propsData.value = newProps.data;
    console.log('ChooseList propsData:', propsData.value); // 调试信息
    checked.value = propsData.value.filter((item) => includes.value.includes(item));
  }
});

const emit = defineEmits(['build-group', 'invite-group', 'cancel']);

async function forward() {
  if (eventType.value === 'build-group') {
    emit('build-group', checked.value);
  } else if (eventType.value === 'invite-group') {
    let temp = checked.value.filter((item) => !includes.value.includes(item));
    emit('invite-group', temp);
  }
  checkAll.value = false;
  checked.value = [];
  isSelect.value = false;
}

const handleCheckAllChange = (val: boolean) => {
  // 获取当前过滤后的可用项目（不包括已包含的项目）
  const availableItems = filteredData.value.filter((item) => !isInclude(item));

  if (val) {
    // 全选：添加所有可用项目到选中列表
    const newCheckedItems = [...checked.value];
    availableItems.forEach((item) => {
      if (!newCheckedItems.includes(item)) {
        newCheckedItems.push(item);
      }
    });
    checked.value = newCheckedItems;
  } else {
    // 取消全选：移除所有可用项目，保留已包含的项目
    checked.value = checked.value.filter((item) => isInclude(item));
  }

  isIndeterminate.value = false;
};

const handleCheckedChange = (value: string[]) => {
  const availableItems = filteredData.value.filter((item) => !isInclude(item));
  const checkedAvailableItems = value.filter((item) => !isInclude(item));

  const checkedCount = checkedAvailableItems.length;
  const availableCount = availableItems.length;

  checkAll.value = availableCount > 0 && checkedCount === availableCount;
  isIndeterminate.value = checkedCount > 0 && checkedCount < availableCount;
};

const isInclude = (item) => {
  return includes.value.includes(item);
};
function cancel() {
  isSelect.value = false;
  emit('cancel', false);
}

const filteredData = computed(() => {
  if (!search.value) {
    return propsData.value;
  }
  const lowerCaseSearch = search.value.toLowerCase();
  return propsData.value.filter((item) => {
    const user = userGather.value[item];
    return user && user.username.toLowerCase().includes(lowerCaseSearch);
  });
});

// 监听搜索变化，更新全选状态
watch(search, () => {
  updateCheckAllState();
});

// 监听过滤后的数据变化，更新全选状态
watch(filteredData, () => {
  updateCheckAllState();
});

// 更新全选状态的函数
const updateCheckAllState = () => {
  const availableItems = filteredData.value.filter((item) => !isInclude(item));
  const checkedAvailableItems = checked.value.filter((item) => !isInclude(item));

  if (availableItems.length === 0) {
    checkAll.value = false;
    isIndeterminate.value = false;
  } else {
    checkAll.value = checkedAvailableItems.length === availableItems.length;
    isIndeterminate.value = checkedAvailableItems.length > 0 && checkedAvailableItems.length < availableItems.length;
  }
};
</script>

<style scoped>
.window {
  margin: auto;
  margin-top: 100px;
  background-color: rgb(255, 255, 255);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
}

/* 移动端弹窗适配 */
@media screen and (max-width: 767px) {
  .window {
    margin-top: 60px;
    margin-left: 16px;
    margin-right: 16px;
    width: calc(100vw - 32px);
    max-width: 400px;
  }
}
.default {
  padding: 35px 40px 40px;
  width: 300px;
  height: 550px;
}

/* 移动端默认样式适配 */
@media screen and (max-width: 767px) {
  .default {
    padding: 20px;
    width: 100%;
    height: calc(100vh - 120px);
    max-height: 600px;
  }
}
.default h6 {
  font-size: 20px;
  font-weight: 800;
  padding: 16px 0;
}
.default .buttons {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}
.media {
  padding-left: 15px;
  align-items: center;
  line-height: 50px;
  font-family: 'IBM Plex Sans', sans-serif;
  display: flex;
  flex-direction: row;
  transition: all 0.3s;
}
.media .avatar {
  margin-right: 13px;
}
.media-body h6 {
  margin-bottom: 0;
  font-weight: 400;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* element ui css */

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  --el-input-focus-border-color: var(--bs-green);
}
.list {
  width: 235px;
  height: 410px;
}

/* 移动端列表适配 */
@media screen and (max-width: 767px) {
  .list {
    width: 100%;
    height: calc(100vh - 300px);
    max-height: 400px;
  }
}
.el-badge {
  height: 40px;
}
.el-checkbox {
  height: 50px;
  margin-right: 0;
}
.default .el-input {
  width: 220px;
  margin-bottom: 10px;
}

/* 移动端输入框适配 */
@media screen and (max-width: 767px) {
  .default .el-input {
    width: 100%;
    margin-bottom: 12px;
  }
}
</style>