<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
export default {
  name:'App',
}
</script>

<script setup lang="ts">
import { useChatStore } from './stores/chat';

const chatStore=useChatStore()
const {connect,getAllData}=chatStore
//刷新重连
let information = window.localStorage.getItem('chatStore')
if(information){
  const store = JSON.parse(information).personalDetail;
  if(Object.keys(store).length !== 0){
    connect()
    getAllData();
  }
}

</script>

<style scoped>
</style>