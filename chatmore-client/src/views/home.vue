<template>
  <div class="show-page">
    <Nav></Nav>
    <router-view></router-view>
    <SearchUsers></SearchUsers>
  </div>
</template>

<script lang="ts">
import Nav from '@/components/Nav.vue';
import { storeToRefs } from 'pinia';
import ChooseCard from '../components/ChooseCard.vue';
import SearchUsers from './search/index.vue';
export default {
  name: 'chat-home',
  components: {
    Nav,
    ChooseCard,
    SearchUsers,
  },
};
</script>

<script lang="ts" setup>
import emitter from '@/utils/emitter';
import { h, onUnmounted } from 'vue';
import { ElNotification } from 'element-plus';

const notice = (value) => {
  ElNotification({
    title: 'Title',
    message: h('i', { style: 'color: teal' }, value),
    position: 'bottom-left',
  });
};

const noTitleNotice = (value) => {
  ElNotification({
    message: value,
    /* duration: 0, */
    position: 'bottom-left',
  });
};

// 绑定事件
emitter.on('notice', (value) => {
  notice(value);
});
emitter.on('notitle-notice', (value) => {
  noTitleNotice(value);
});

onUnmounted(() => {
  // 解绑事件
  emitter.off('notice');
  emitter.off('center-top-notice');
});
</script>


<style scoped>
:deep(.el-notification) {
  width: 200px;
}

.show-page {
  display: flex;
}

/* 移动端布局适配 */
@media screen and (max-width: 767px) {
  .show-page {
    flex-direction: column;
    height: 100vh;
  }
}
</style>