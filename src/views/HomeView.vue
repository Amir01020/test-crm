<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Заголовок с переключателем вида -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Рекламные кампании</h1>
        
        <!-- Переключатель вида -->
        <div class="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-50">
          <button
            @click="isGridView = false"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              !isGridView 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <button
            @click="isGridView = true"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              isGridView 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Загрузка -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="text-gray-600">Загрузка...</div>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {{ error }}
      </div>

      <!-- Режим сетки (по умолчанию) -->
      <div v-else-if="campaigns.length > 0 && isGridView" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="campaign in campaigns" 
          :key="campaign.id"
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col cursor-pointer"
          @click="viewCampaign(campaign.id)"
        >
          <div class="flex justify-between items-start mb-3">
            <h2 class="text-xl font-semibold text-gray-900">{{ campaign.name }}</h2>
            <span 
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                campaign.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              ]"
            >
              {{ getStatusLabel(campaign.status) }}
            </span>
          </div>

          <div class="space-y-2 mb-4">
            <div class="flex items-center gap-2 text-gray-700">
              <span class="font-medium">Канал:</span>
              <span class="capitalize">{{ campaign.source }}</span>
              <img :src="`${campaign.source}.svg`" class="w-5" alt="">
            </div>
            
            <div v-if="campaign.cost" class="flex items-center gap-2 text-gray-700">
              <span class="font-medium">Стоимость:</span>
              <span>{{ campaign.cost }} сум</span>
            </div>
          </div>

          <p class="text-gray-600 text-sm leading-relaxed mb-4 flex-grow">
            {{ truncateDescription(campaign.description) }}
          </p>

          <div class="pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
              <span>Лидов: {{ campaign.leads_count }}</span>
              <span v-if="campaign.start_date">
                {{ formatDate(campaign.start_date) }}
              </span>
            </div>
            
            <button
              @click.stop="viewCampaign(campaign.id)"
              class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Посмотреть
            </button>
          </div>
        </div>
      </div>

      <!-- Режим списка -->
      <div v-else-if="campaigns.length > 0 && !isGridView" class="space-y-4">
        <div 
          v-for="campaign in campaigns" 
          :key="campaign.id"
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer"
          @click="viewCampaign(campaign.id)"
        >
          <!-- Основная информация -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h2 class="text-2xl font-semibold text-gray-900">{{ campaign.name }}</h2>
                <span 
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-medium',
                    campaign.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ getStatusLabel(campaign.status) }}
                </span>
              </div>

              <p v-if="campaign.description" class="text-gray-600 text-sm leading-relaxed mb-4">
                {{ campaign.description }}
              </p>
            </div>
          </div>

          <!-- Детали в одну строку -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
            <div class="flex items-center gap-2">
              <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <img v-if="campaign.source" :src="`${campaign.source}.svg`" class="w-6 h-6" alt="">
              </div>
              <div>
                <p class="text-xs text-gray-500">Канал</p>
                <p class="text-sm font-semibold text-gray-900 capitalize">{{ campaign.source }}</p>
              </div>
            </div>

            <div v-if="campaign.cost" class="flex items-center gap-2">
              <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-500">Стоимость</p>
                <p class="text-sm font-semibold text-gray-900">{{ campaign.cost }} сум</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-500">Лидов</p>
                <p class="text-sm font-semibold text-gray-900">{{ campaign.leads_count || 0 }}</p>
              </div>
            </div>

            <div v-if="campaign.start_date" class="flex items-center gap-2">
              <div class="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-500">Дата начала</p>
                <p class="text-sm font-semibold text-gray-900">{{ formatDate(campaign.start_date) }}</p>
              </div>
            </div>
          </div>

          <!-- Кнопка действия -->
          <div class="pt-4 border-t border-gray-200">
            <button
              @click.stop="viewCampaign(campaign.id)"
              class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <span>Посмотреть детали</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Пустой список -->
      <div v-else class="bg-white rounded-lg shadow-md p-12 text-center">
        <p class="text-gray-500">Нет рекламных кампаний</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const campaigns = ref([]);
const isLoading = ref(true);
const isGridView = ref(true); // true = сетка (по умолчанию), false = список
const error = ref('');

// Функция для получения токена из cookies
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

// Функция для сокращения описания
const truncateDescription = (text) => {
  if (!text) return '';
  const maxLength = 100;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Функция для форматирования даты
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Функция для получения метки статуса
const getStatusLabel = (status) => {
  const labels = {
    'active': 'Активна',
    'inactive': 'Неактивна',
    'paused': 'Приостановлена',
    'completed': 'Завершена'
  };
  return labels[status] || status;
};

// Функция перехода на страницу просмотра кампании
const viewCampaign = (campaignId) => {
  router.push(`/campaigns/${campaignId}`);
};

// Функция для получения рекламных кампаний
const fetchAdvertisingCampaigns = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    // Получаем токен из cookies или localStorage
    let token = getCookie('authToken');
    
    if (!token) {
      token = localStorage.getItem('authToken');
    }

    if (!token) {
      error.value = 'Токен не найден. Пожалуйста, войдите в систему.';
      return;
    }

    console.log('Используемый токен:', token);

    const response = await axios.get('https://stage-back.shamcrm.com/api/advertising-campaigns', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Данные рекламных кампаний:', response.data);
    
    // Данные приходят в формате { result: { data: [...], pagination: {...} } }
    if (response.data.result && response.data.result.data) {
      campaigns.value = response.data.result.data;
    } else if (Array.isArray(response.data)) {
      campaigns.value = response.data;
    } else {
      campaigns.value = [];
    }

  } catch (err) {
    if (err.response) {
      console.error('Ошибка ответа сервера:', err.response.data);
      console.error('Статус:', err.response.status);
      error.value = `Ошибка: ${err.response.status}. ${err.response.data.message || 'Не удалось загрузить данные'}`;
    } else if (err.request) {
      console.error('Ошибка запроса:', err.request);
      error.value = 'Ошибка соединения. Проверьте интернет-подключение.';
    } else {
      console.error('Ошибка:', err.message);
      error.value = 'Произошла ошибка при загрузке данных.';
    }
  } finally {
    isLoading.value = false;
  }
};

// Загружаем данные при монтировании компонента
onMounted(() => {
  fetchAdvertisingCampaigns();
});
</script>