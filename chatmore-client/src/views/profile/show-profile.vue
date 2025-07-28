<template>
  <div>
    <div :class="{ fade: isActive }">
      <div class="confirm-window" v-show="isActive">
        <h6>{{ confirmWindowTitle }}</h6>
        <div>
          <el-button @click="handleCancel">返回</el-button>
          <el-button type="primary" @click="forward">确认</el-button>
        </div>
      </div>
    </div>
    <div class="show-window">
      <el-descriptions v-if="type === 'user'" title="" direction="vertical" :column="2" size="large" border>
        <el-descriptions-item label="用户昵称">{{ name }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ phone }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ gender }}</el-descriptions-item>
        <el-descriptions-item label="生日">{{ birth }}</el-descriptions-item>
        <el-descriptions-item label="个性签名"> <el-tag size="small">School</el-tag>{{ info }} </el-descriptions-item>
      </el-descriptions>
      <el-descriptions v-if="type === 'group'" title="" direction="vertical" :column="2" size="large" border>
        <el-descriptions-item label="群昵称" v-if="name">{{ name }}</el-descriptions-item>
        <el-descriptions-item label="群主" v-if="createdBy">{{ createdBy }}</el-descriptions-item>
        <el-descriptions-item label="建群时间" v-if="createdAt">{{ createdAt }}</el-descriptions-item>
        <el-descriptions-item label="群介绍" v-if="info" :span="2"> <el-tag size="small">School</el-tag>{{ info }} </el-descriptions-item>

        <el-descriptions-item label="群成员列表" :span="2" class="list">
          <el-scrollbar max-height="500">
            <div class="media" v-for="item in members" :key="item._id">
              <div class="avatar">
                <el-badge is-dot :offset="[-6, 6]" color="var(--bs-green)" badge-style="width:11px;height:11px;">
                  <el-avatar :size="50" :src="`${SERVER_URL}/avatar/${item.profilePicture}`" alt="Avataaars" />
                </el-badge>
              </div>
              <div class="media-body">
                <el-tag size="small" type="warning" v-if="item.role === 'owner'">群主</el-tag>
                <el-tag size="small" v-if="item.role === 'admin'">管理员</el-tag>
                <el-tag size="small" v-if="item.role === 'normal'" effect="plain">群成员</el-tag>
                &nbsp;{{ item.username }}
                <p>{{ format(new Date(item.joinedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN }) }}</p>
              </div>
              <div class="menu">
                <el-dropdown @command="(command) => handleCommand(command, item)">
                  <span class="el-dropdown-link">
                    <el-icon><MoreFilled /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="viewProfile">
                        <RouterLink :to="{ name: 'profile', query: { id: item.userId, type: 'user' } }"> 查看资料 </RouterLink>
                      </el-dropdown-item>
                      <el-dropdown-item command="promoteToAdmin" v-if="canPromoteToAdmin(item)">设为管理员</el-dropdown-item>
                      <el-dropdown-item command="demoteFromAdmin" v-if="canDemoteFromAdmin(item)">取消管理员</el-dropdown-item>
                      <el-dropdown-item command="removeMember" v-if="canRemoveMember(item)">移出本群</el-dropdown-item>
                      <el-dropdown-item command="exitGroup" v-if="canExitGroup(item)">退出本群</el-dropdown-item>
                      <el-dropdown-item command="destroyGroup" v-if="canDestroyGroup(item)">解散本群</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </el-scrollbar>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script lang="ts">
import ContactCard from '@/components/ContactCard.vue';
import emitter from '../../utils/emitter';
import router from '../../router';
export default {
  name: 'show-profile',
  components: {
    ContactCard,
  },
};
</script>

<script setup lang="ts">
import { watch, ref, reactive, computed, inject, toRaw, onMounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import { storeToRefs } from 'pinia';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { sign } from 'node:crypto';
import { useRoute } from 'vue-router';
import { getGroupMembers } from '@/api/modules/group';
import { SERVER_URL } from '@/api/index';
const chatStore = useChatStore();
const { chatMap, groupGather, personalDetail } = storeToRefs(chatStore);

const route = useRoute();
const id = computed(() => route.query.id);
const type = computed(() => route.query.type);

let props = defineProps(['result', 'type']);
let isActive = ref(false); //测试中
let confirmWindowTitle = '';
let eventType = ref('');
let memberItem = ref({});

let personalId = ref('');
let name = ref('');
let gender = ref('');
let birth = ref('');
let phone = ref('');
let info = ref('');
let createdAt = ref('');

let role = ref('normal');
let createdBy = ref('');
let members = ref([]);

//根据群成员身份赋予不同的操作权限

const canPromoteToAdmin = (item) => {
  return role.value === 'owner' && personalId.value !== item.userId && item.role === 'normal';
};

const canDemoteFromAdmin = (item) => {
  return role.value === 'owner' && personalId.value !== item.userId && item.role === 'admin';
};

const canRemoveMember = (item) => {
  return role.value === 'owner' && personalId.value !== item.userId;
};

const canExitGroup = (item) => {
  return personalId.value === item.userId && role.value !== 'owner';
};

const canDestroyGroup = (item) => {
  return personalId.value === item.userId && role.value === 'owner';
};

//操作命令

const handleCommand = (command, member) => {
  eventType.value = command;
  memberItem.value = member;
  if (command === 'promoteToAdmin') {
    member.role = 'admin';
    chatStore.updateGroupMemberRole({
      groupId: id.value,
      userId: member.userId,
      role: 'admin',
    });
  } else if (command === 'demoteFromAdmin') {
    member.role = 'normal';
    chatStore.updateGroupMemberRole({
      groupId: id.value,
      userId: member.userId,
      role: 'normal',
    });
  } else if (command === 'removeMember') {
    isActive.value = true;
    confirmWindowTitle = '确定将该群成员移出群聊？';
  } else if (command === 'deleteGroup') {
    isActive.value = true;
    confirmWindowTitle = '确定退出该群聊？';
  } else if (command === 'destroyGroup') {
    isActive.value = true;
    confirmWindowTitle = '确定解散该群聊？';
  }
};

//确认执行操作

function forward() {
  if (eventType.value === 'removeMember') {
    let index = members.value.indexOf(memberItem.value);
    if (index !== -1) {
      members.value.splice(index, 1);
    }
    chatStore.removeMember({
      groupId: id.value,
      userId: memberItem.value.userId,
    });
  } else if (eventType.value === 'exitGroup') {
    let index = members.value.indexOf(memberItem.value);
    if (index !== -1) {
      members.value.splice(index, 1);
    }
    chatStore.exitGroup({
      groupId: id.value,
    });
  } else if (eventType.value === 'destroyGroup') {
    router.back();
    chatStore.destroyGroup({
      groupId: id.value,
    });
  }
  isActive.value = false;
}

function handleCancel() {
  isActive.value = false;
}

watch(
  () => props.result,
  (newResult) => {
    if (props.type === 'user') {
      name.value = newResult.username;
      gender.value = newResult.gender;
      birth.value = format(new Date(newResult.birth), 'yyyy-MM-dd', { locale: zhCN });
      phone.value = newResult.phone;
      info.value = newResult.signature;
    } else if (props.type === 'group') {
      name.value = newResult.groupName;
      gender.value = newResult.gender;
      createdAt.value = format(new Date(newResult.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN });
      info.value = newResult.groupDescription;
    }
  }
);

// 在组件挂载后执行异步操作
async function loadProfile() {
  try {
    if (type.value === 'user' || type.value === 'request') {
      // Assuming getUserProfile is defined elsewhere or will be added
      // result.value = await getUserProfile(id.value.toString());
    } else if (type.value === 'group') {
      // Assuming getGroupProfile is defined elsewhere or will be added
      // result.value = await getGroupProfile(id.value.toString());
      members.value = await getGroupMembers(id.value);
      members.value.forEach((member) => {
        if (member.userId === personalDetail.value._id) {
          role.value = member.role;
        }
      });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
}

onMounted(() => {
  loadProfile();
});

watch(
  () => [id.value, type.value],
  () => {
    loadProfile();
  }
);
</script>

<style scoped>
.show-window {
  padding: 20px 40px;
}
.fade {
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 2;
}
.fade .confirm-window {
  margin-left: 350px;
  margin-top: 200px;
  padding: 30px 0;
  width: 320px;
  height: 175px;
  background-color: rgb(255, 255, 255);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  box-shadow: 0px 0rem 7rem 20px rgba(0, 0, 0, 0.075);
}

/* 移动端确认弹窗适配 */
@media screen and (max-width: 767px) {
  .fade .confirm-window {
    margin-left: 16px;
    margin-right: 16px;
    margin-top: 100px;
    width: calc(100vw - 32px);
    max-width: 320px;
    padding: 20px;
    height: auto;
    min-height: 150px;
  }
}
.el-descriptions {
  width: 850px;
  margin-bottom: 20px;
}
.menu {
  margin-left: 28px;
}
.show {
  display: block;
}
.media {
  width: 50%;
  float: left;
  align-items: center;
  font-family: 'IBM Plex Sans', sans-serif;
}
.media-body {
  width: 83%;
  height: 100%;
}
.media-body p {
  width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.media-body p {
  color: rgb(149, 170, 201);
}
.media-body h6 {
  width: 200px;
  margin-bottom: 0;
  font-weight: 400;
  font-size: 17px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.show {
  display: block;
}
.media {
  padding: 16px;
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: space-between;
}

.media .avatar {
  margin-right: 13px;
}

.el-dropdown-link {
  outline: none;
}
:deep(.el-dropdown-menu__item) {
  --el-dropdown-menuItem-hover-fill: rgba(33, 170, 147, 0.1);
  --el-dropdown-menuItem-hover-color: var(--bs-green);
}
.list .media {
  float: left;
}
</style>