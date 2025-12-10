import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue'

// Функция для получения токена из cookies
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

// Функция проверки аутентификации - проверяем только cookies
const isAuthenticated = () => {
  const token = getCookie('authToken');
  console.log('Checking authToken in cookies:', token ? 'Found' : 'Not found');
  return !!token;
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        // Проверяем токен и перенаправляем соответственно
        return isAuthenticated() ? '/home' : '/login';
      }
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { requiresGuest: true }
    },
    {
      path: '/campaigns/:id',
      name: 'CampaignDetail',
      component: () => import('@/views/CampaignDetail.vue'),
      meta: { requiresAuth: true }
    }
  ],
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated();

  console.log('Navigation Guard:', {
    to: to.path,
    authenticated,
    requiresAuth: to.meta.requiresAuth,
    requiresGuest: to.meta.requiresGuest
  });

  // Если маршрут требует аутентификации
  if (to.meta.requiresAuth && !authenticated) {
    console.log('Redirecting to /login - no auth');
    next('/login');
    return;
  }
  
  // Если пользователь авторизован и пытается попасть на страницу логина
  if (to.meta.requiresGuest && authenticated) {
    console.log('Redirecting to /home - already authenticated');
    next('/home');
    return;
  }
  
  // Во всех остальных случаях продолжаем навигацию
  next();
});

export default router