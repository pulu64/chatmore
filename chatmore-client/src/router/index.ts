import Cookies from 'js-cookie';
import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: { requiresAuth: true }, // 需要身份验证
      component: () => import("../views/home.vue"),
      children: [
        {
          path: '/chat',
          name: 'chat',
          component: () => import("@/views/chat/index.vue"),
          children: [
            {
              path: '/chatmore',
              name: 'chatmore',
              component: () => import("@/views/chat/sidebar/chatmore.vue"),
            },
            {
              path: '/contact',
              name: 'contact',
              component: () => import("@/views/chat/sidebar/contact.vue"),
            },
            {
              path: '/my-profile',
              name: 'my-profile',
              component: () => import("@/views/profile/sidebar.vue"),
            }
          ]
        },
        {
          path: '/profile',
          name: 'profile',
          component: () => import("@/views/profile/index.vue"),
        },
      ]
    },
    {
      path: '/signup',
      name: 'sign-up',
      component: () => import("@/views/sign-up.vue"),
    },
    {
      path: '/signin',
      name: 'sign-in',
      component: () => import("@/views/sign-in.vue"),
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import("@/views/reset-password.vue"),
    },
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = Cookies.get('token');
  if (to.meta.requiresAuth && !token) {
    // 如果路由需要身份验证但没有 token，重定向到登录页面
    next({ path: '/signin' });
  } else {
    next(); // 确保要调用 next()
  }
});


export default router
