<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
export default {
  name: 'App',
};
</script>

<script setup lang="ts">
import { useChatStore } from './stores/chat';

const chatStore = useChatStore();
// 刷新重连
let information = window.localStorage.getItem('chatStore');
let store = {};
if (information) {
  try {
    store = JSON.parse(information).personalDetail || {};
  } catch (e) {
    store = {};
  }
}
if (Object.keys(store).length !== 0) {
  // 直接调用 chatStore 的方法（actions）
  if (typeof (chatStore as any).connect === 'function') {
    (chatStore as any).connect();
  }
  if (typeof (chatStore as any).getAllData === 'function') {
    (chatStore as any).getAllData();
  }
}
</script>

<style scoped>
</style>