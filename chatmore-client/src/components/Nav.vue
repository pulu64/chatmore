<template>
  <div class="navbar">
    <div class="chat">
      <RouterLink to="/chatmore" active-class="active">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 46" fill="none">
          <g id="logo-icon-color">
            <path
              id="Vector"
              d="M26.4966 6.01307V2.00436L22.9746 0L19.5029 2.00436V6.01307L22.9746 8.01743L26.4966 6.01307Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_2"
              d="M34.7989 10.8235V6.81477L31.3272 4.81042L27.8555 6.81477V10.8235L31.3272 12.8279L34.7989 10.8235Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_3"
              d="M43 15.4837V11.4749L39.5283 9.47058L36.0063 11.4749V15.4837L39.5283 17.488L43 15.4837Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_4"
              d="M43 25.0043V20.9956L39.5283 18.9913L36.0063 20.9956V25.0043L39.5283 27.0087L43 25.0043Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_5"
              d="M33.9935 19.9935V16.9368L31.3269 15.4336L28.6602 16.9368V19.9935L31.3269 21.5469L33.9935 19.9935Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_6"
              d="M33.9935 29.5142V26.4575L31.3269 24.9041L28.6602 26.4575V29.5142L31.3269 31.0174L33.9935 29.5142Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_7"
              d="M15.931 19.6928V17.2876L13.8178 16.085L11.7549 17.2876V19.6928L13.8178 20.8453L15.931 19.6928Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_8"
              d="M15.931 29.1634V26.7582L13.8178 25.5555L11.7549 26.7582V29.1634L13.8178 30.366L15.931 29.1634Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_9"
              d="M6.4717 24.0022V21.9978L4.76101 20.9956L3 21.9978V24.0022L4.76101 25.0044L6.4717 24.0022Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_10"
              d="M43 34.4749V30.4662L39.5283 28.4619L36.0063 30.4662V34.4749L39.5283 36.4793L43 34.4749Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_11"
              d="M25.9433 15.1329V11.8758L23.1257 10.2222L20.2578 11.8758V15.1329L23.1257 16.7865L25.9433 15.1329Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_12"
              d="M25.9433 34.1242V30.8671L23.1257 29.2135L20.2578 30.8671V34.1242L23.1257 35.7778L25.9433 34.1242Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_13"
              d="M25.4908 24.3529V21.597L23.126 20.244L20.7109 21.597V24.3529L23.126 25.756L25.4908 24.3529Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_14"
              d="M34.7989 39.1852V35.1765L31.3272 33.1721L27.8555 35.1765V39.1852L31.3272 41.1896L34.7989 39.1852Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_15"
              d="M16.6856 10.2222V6.91507L13.8176 5.26147L10.9497 6.91507V10.2222L13.8176 11.8257L16.6856 10.2222Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_16"
              d="M6.22013 12.9782V11.1242L4.61006 10.1721L3 11.1242V12.9782L4.61006 13.9303L6.22013 12.9782Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_17"
              d="M26.4966 43.9956V39.9868L22.9746 37.9825L19.5029 39.9868V43.9956L22.9746 45.9999L26.4966 43.9956Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_18"
              d="M16.6856 39.0849V35.7777L13.8176 34.1241L10.9497 35.7777V39.0849L13.8176 40.7385L16.6856 39.0849Z"
              fill="rgb(33, 170, 147)"
            />
            <path
              id="Vector_19"
              d="M7.5283 34.8257V32.22L5.26415 30.9172L3 32.22V34.8257L5.26415 36.1285L7.5283 34.8257Z"
              fill="rgb(33, 170, 147)"
            />
          </g>
        </svg>
      </RouterLink>
    </div>
    <div class="tool">
      <RouterLink :to="{ name: 'my-profile', query: { id: personalDetail._id, type: 'user' } }" active-class="active">
        <el-avatar :size="25" :src="`${SERVER_URL}/avatar/${personalDetail.profilePicture}`" />
      </RouterLink>
      <RouterLink to="/chatmore" active-class="active">
        <i class="iconfont icon-xinxiaoxi"></i>
      </RouterLink>
      <RouterLink to="/contact" active-class="active">
        <i class="iconfont icon-lianxiren"></i>
      </RouterLink>
      <RouterLink to="/contact" active-class="active">
        <i class="iconfont icon-dianhua"></i>
      </RouterLink>
      <RouterLink to="/contact" active-class="active">
        <i class="iconfont icon-youjian"></i>
      </RouterLink>

      <el-button color="var(--bs-green)" @click="signout">out</el-button>
    </div>
    <RouterLink :to="{ name: 'profile', query: { id: personalDetail._id, type: 'user' } }" active-class="active">
      <i class="iconfont icon-chilun"></i>
    </RouterLink>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Nav',
};
</script>


<script lang="ts" setup>
import { ref } from 'vue';
import { useChatStore } from '../stores/chat';
import { useRouter } from 'vue-router';
import Cookies from 'js-cookie';
import { storeToRefs } from 'pinia';
import { SERVER_URL } from '@/api/index';
const router = useRouter();
const chatStore = useChatStore();
const { disconnect } = chatStore;
const { personalDetail } = storeToRefs(chatStore);

async function signout() {
  await router.push('/signin');
  Cookies.remove('token');
  disconnect();
}
</script>


<style scoped>
.navbar {
  padding: 1.5rem 1rem;
  width: 80px;
  height: 100vh;
  background-color: rgb(243, 242, 239);
  border-right: 2px solid #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* justify-content: space-between; */
}

/* 移动端导航栏适配 */
@media screen and (max-width: 767px) {
  .navbar {
    width: 100%;
    height: 60px;
    flex-direction: row;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-right: none;
    border-bottom: 2px solid #fff;
  }
}

.chat {
  margin-bottom: 50px;
}

/* 移动端聊天图标适配 */
@media screen and (max-width: 767px) {
  .chat {
    margin-bottom: 0;
  }
}

svg {
  width: 35px;
  backdrop-filter: var(--bs-green);
  border-bottom: 1px solid transparent;
}

/* 移动端SVG适配 */
@media screen and (max-width: 767px) {
  svg {
    width: 28px;
  }
}

.tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 50px;
  flex-grow: 1;
}

/* 移动端工具栏适配 */
@media screen and (max-width: 767px) {
  .tool {
    flex-direction: row;
    margin-bottom: 0;
    flex-grow: 0;
    gap: 16px;
  }
}

.tool a {
  padding: 8px 0;
  margin-bottom: 16px;
}

/* 移动端工具链接适配 */
@media screen and (max-width: 767px) {
  .tool a {
    padding: 8px;
    margin-bottom: 0;
  }
}

i {
  transition: all 0.3s;
  font-size: 20px;
}

/* 移动端图标适配 */
@media screen and (max-width: 767px) {
  i {
    font-size: 18px;
  }
}

.active i {
  color: var(--bs-green);
}

.el-avatar {
  outline: 1.5px solid rgb(191, 188, 188);
}

/* 移动端头像适配 */
@media screen and (max-width: 767px) {
  .el-avatar {
    width: 32px !important;
    height: 32px !important;
  }
}

/* 移动端按钮适配 */
@media screen and (max-width: 767px) {
  .el-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>