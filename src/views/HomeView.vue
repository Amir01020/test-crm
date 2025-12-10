<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Рекламные кампании</h1>
      
      <!-- Загрузка -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="text-gray-600">Загрузка...</div>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {{ error }}
      </div>

      <!-- Список кампаний -->
      <div v-else-if="campaigns.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="campaign in campaigns" 
          :key="campaign.id"
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col"
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
              @click="viewCampaign(campaign.id)"
              class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Посмотреть
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

