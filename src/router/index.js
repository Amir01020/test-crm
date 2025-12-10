import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
    },{
      path: '/campaigns/:id',
      name: 'CampaignDetail',
      component: () => import('@/views/CampaignDetail.vue')
    }
   
  ],
})

export default router
