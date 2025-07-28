<template>
  <div class="container">
    <div class="card">
      <h1>Sign up</h1>
      <p>创建一个属于你的聊天账号吧！🎉</p>
      <el-form :model="form" label-width="auto">
        <el-form-item>
          <el-input v-model="form.email" placeholder="请输入注册邮箱" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" placeholder="请输入密码" />
        </el-form-item>
      </el-form>
      <el-button color="var(--bs-green)" @click="onSubmit">Sign up</el-button>
      <p>
        如果您已经拥有账号&nbsp;
        <RouterLink to="/signin" active-class="active" class="link"> 登录 </RouterLink>
      </p>
      <div class="extend">
        <el-button type="danger" plain style="width: 100%">Signup with Google</el-button>
        <el-button type="primary" plain style="width: 100%">Signup with Facebook</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'sign-up',
};
</script>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { reactive } from 'vue';
import { signUp } from '../api/modules/user';

// do not use same name with ref
const form = reactive({
  email: '',
  username: '',
  password: '',
});

const onSubmit = async () => {
  if (form.username && form.email && form.password) {
    const data = await signUp(form);
    console.log(data);
  } else if (form.username === '') {
    ElMessage.warning('用户名不能为空！');
  } else if (form.email === '') {
    ElMessage.warning('邮箱不能为空！');
  } else if (form.password === '') {
    ElMessage.warning('密码不能为空！');
  }
};
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

/* 移动端容器适配 */
@media screen and (max-width: 767px) {
  .container {
    padding: 16px;
  }
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

/* 移动端卡片适配 */
@media screen and (max-width: 767px) {
  .card {
    padding: 24px 20px;
    width: 100%;
    max-width: 380px;
  }

  .card h1 {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .card p {
    font-size: 14px;
    text-align: center;
  }
}

.el-input {
  height: 55px;
  padding: 5px;
}

/* 移动端输入框适配 */
@media screen and (max-width: 767px) {
  .el-input {
    height: 48px;
    padding: 4px;
  }
}

.el-button {
  margin: 0;
  margin-bottom: 24px;
}

/* 移动端按钮适配 */
@media screen and (max-width: 767px) {
  .el-button {
    margin-bottom: 16px;
    width: 100%;
    height: 48px;
  }
}

.extend {
  margin-top: 5px;
}

.extend .el-button {
  margin: 5px 0;
}

/* 移动端扩展按钮适配 */
@media screen and (max-width: 767px) {
  .extend .el-button {
    margin: 8px 0;
    height: 44px;
  }
}

:deep(.el-input__wrapper) {
  --el-input-focus-border-color: var(--bs-green);
}

.el-link {
  float: right;
  color: var(--bs-green);
}

/* .card-body{
  
} */

.link {
  font-size: 14px;
  font-family: 'Noto Sans', sans-serif;
  font-weight: 500;
  color: #21aa93;
}

/* 移动端链接适配 */
@media screen and (max-width: 767px) {
  .link {
    font-size: 13px;
  }
}

.link:hover {
  text-decoration: underline;
}

.link:active {
  color: #21aa93;
}

.el-form {
  padding: 40px 0;
  width: 290px;
}

/* 移动端表单适配 */
@media screen and (max-width: 767px) {
  .el-form {
    padding: 24px 0;
    width: 100%;
  }
}

.el-form-item {
  margin-bottom: 0;
}

/* 移动端表单项适配 */
@media screen and (max-width: 767px) {
  .el-form-item {
    margin-bottom: 12px;
  }
}
</style>