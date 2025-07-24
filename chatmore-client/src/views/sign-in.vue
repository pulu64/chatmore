<template>
  <div class="container">
    <div class="card">
      <h1>Sign in</h1>
      <p>这里是Chatmore，欢迎体验~😊</p>
      <div class="input-group">
        <el-input v-model="credential" placeholder="请输入您的用户昵称/邮箱" />
        <el-input v-model="password" type="password" placeholder="请输入密码" show-password />
        <div class="alignment-container">
          <el-checkbox v-model="checked1" label="记住我" size="large" />
          <RouterLink to="/reset-password" active-class="active" class="link"> 重置密码 </RouterLink>
        </div>
      </div>
      <el-button color="var(--bs-green)" @click="signin">Sign in</el-button>
      <p>
        如果您还未拥有账号&nbsp;&nbsp;
        <RouterLink to="/signup" active-class="active" class="link"> 注册用户 </RouterLink>
      </p>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'sign-in',
};
</script>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { useChatStore } from '../stores/chat/index';
import { useRouter } from 'vue-router';
import Cookies from 'js-cookie';
import { ref } from 'vue';
import { patchUser } from '../api/modules/user';
import { log } from 'console';
const router = useRouter();
const credential = ref('');
const password = ref('');
const checked1 = ref('');
const chatStore = useChatStore();
const { connect, getAllData } = chatStore;

async function signin() {
  try {
    if (credential.value === '') {
      ElMessage.warning('昵称或邮箱不能为空！');
      return;
    } else if (password.value === '') {
      ElMessage.warning('请输入密码！');
      return;
    }
    const data = await patchUser(credential.value, password.value);

    // 存储 token
    Cookies.set('token', data.matchDetail.token, { expires: 7 }); // 有效期为 7 天
    connect();
    getAllData();
    router.push('/chatmore');
    ElMessage.success(data.message);
  } catch (error) {
    ElMessage.error(error.response.data.error);
  }
}
</script>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  background: rgb(243, 242, 239);
  display: flex;
  justify-content: center;
  align-items: center;
}
.card {
  padding: 40px;
  width: 380px;
  background-color: #fff;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.input-group {
  margin: 40px 0;
}
.el-input {
  height: 55px;
  padding: 5px;
}
.el-button {
  margin: 0;
  margin-bottom: 24px;
}
.extend {
  margin-top: 5px;
}
.extend .el-button {
  margin: 5px 0;
}
:deep(.el-input__wrapper) {
  --el-input-focus-border-color: var(--bs-green);
}
.el-link {
  float: right;
  color: var(--bs-green);
}
.alignment-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5px;
}
.link {
  font-size: 14px;
  font-family: 'Noto Sans', sans-serif;
  font-weight: 500;
  color: #21aa93;
}
.link:hover {
  text-decoration: underline;
}
.link:active {
  color: #21aa93;
}
</style>