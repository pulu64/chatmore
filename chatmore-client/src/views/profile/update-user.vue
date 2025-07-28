<template>
  <div class="show-window">
    <el-form :model="form" label-width="auto" style="max-width: 600px" :disabled="isDisabled" size="large">
      <el-form-item label="姓名">
        <el-input v-model="form.username" :placeholder="form.username" />
      </el-form-item>
      <el-form-item label="电话">
        <el-input v-model="form.phone" :placeholder="form.phone" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="email" disabled :placeholder="email" />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="form.gender" :placeholder="form.gender">
          <el-option label="male" value="male" />
          <el-option label="female" value="female" />
        </el-select>
      </el-form-item>
      <el-form-item label="生日">
        <el-col :span="11">
          <el-date-picker v-model="form.birth" type="date" :placeholder="form.birth" style="width: 100%" />
        </el-col>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-input v-model="createdAt" disabled :placeholder="createdAt" />
      </el-form-item>
      <el-form-item label="个性签名">
        <el-input v-model="form.signature" type="textarea" :placeholder="form.signature" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">Create</el-button>
        <el-button>Cancel</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
export default {
  username: 'update-user',
};
</script>

<script setup lang="ts">
import { watch, ref, reactive, computed } from 'vue';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
const chatStore = useChatStore();
const { updateUserProfile } = chatStore;
let isDisabled = ref(false);
let createdAt = ref('');
let email = ref('');

const form = reactive({
  username: '',
  phone: '',
  gender: '',
  birth: '',
  signature: '',
});

const data = computed(() => {
  return chatStore.personalDetail;
});

watch(
  data,
  (newData) => {
    if (newData) {
      //名称
      form.username = newData.username;
      email.value = newData.email;
      form.phone = newData.phone;
      form.gender = newData.gender;
      form.signature = newData.signature;
      form.birth = format(newData.birth, 'yyyy/MM/dd', { locale: zhCN });
      createdAt.value = format(newData.createdAt, 'yyyy/MM/dd', { locale: zhCN });
    }
  },
  { immediate: true, deep: true }
);

function handleSelect() {}

const onSubmit = () => {
  console.log(form);

  updateUserProfile(form);
};
</script>

<style scoped>
.show-window {
  padding: 40px 40px;
}

/* 移动端适配 */
@media screen and (max-width: 767px) {
  .show-window {
    padding: 20px;
  }
}

.el-form-item label {
  font-size: 16px;
}

/* 移动端标签适配 */
@media screen and (max-width: 767px) {
  .el-form-item label {
    font-size: 14px;
  }
}
</style>