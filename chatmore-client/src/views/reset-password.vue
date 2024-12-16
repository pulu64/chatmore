<template>
  <div class="container">
    <div class="card">
      <h1>密码重置</h1>
      <p>请输入您当时注册的邮箱</p>
      <el-input v-model="email" placeholder="请输入邮箱" />
     
      <el-button color=var(--bs-green)>发送重置链接</el-button>
      <p>如果您还未拥有账号&nbsp;&nbsp;
        <RouterLink to="/signup" active-class="active" class="link">
          注册用户
        </RouterLink>
      </p>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
  name:'reset-password'
  }
</script>

<script setup lang="ts">
  import { ref } from 'vue'
  const email = ref('')
  const password = ref('')
</script>

<style scoped>
.container{
  width: 100vw;
  height: 100vh;
  background: rgb(243, 242, 239);
  display: flex;
  justify-content: center;
  align-items: center;
}
.card{
  padding: 40px;
  width: 380px;
  background-color: #fff;
  box-shadow: 0 .125rem .25rem rgba(0, 0, 0, 0.075);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.el-input{
  margin: 40px 0;
  height:55px ;
  padding: 5px;
}
.el-button{
  margin: 0;
  margin-bottom: 24px;
}
.extend{
  margin-top: 5px;
}
.extend .el-button{
  margin: 5px 0;
}
:deep(.el-input__wrapper) {
  --el-input-focus-border-color: var(--bs-green);
}
.el-link{
  float: right;
  color:var(--bs-green)
}
.alignment-container{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5px;
}
.link{
font-size: 14px;
font-family:  "Noto Sans", sans-serif;
font-weight: 500;
color :#21AA93
}
.link:hover{
  text-decoration: underline;
}
.link:active{
  color :#21AA93
}
</style>