<template>
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Загрузка -->
        <div v-if="isLoading" class="flex justify-center items-center py-12">
          <div class="text-gray-600 text-lg">Загрузка...</div>
        </div>
  
        <!-- Ошибка -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {{ error }}
        </div>
  
        <!-- Детали кампании -->
        <div v-else-if="campaign" class="space-y-6">
          <!-- Основная информация -->
          <div class="bg-white rounded-lg shadow-lg p-8">
            <!-- Шапка -->
            <div class="flex items-center justify-between mb-6">
              <button
                @click="goBack"
                class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span>←</span>
                <span>Назад</span>
              </button>
              
              <div class="flex items-center gap-3">
                <span 
                  :class="[
                    'px-4 py-2 rounded-full text-sm font-medium',
                    campaign.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ getStatusLabel(campaign.result.status) }}
                </span>
                
                <button
                  v-if="!isEditMode"
                  @click="toggleEditMode"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Редактировать
                </button>
              </div>
            </div>
  
            <!-- Режим просмотра -->
            <div v-if="!isEditMode" class="space-y-6">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ campaign.result.name }}</h1>
              </div>
  
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p class="text-sm text-gray-600 mb-1">Стоимость</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ campaign.result.cost || 0 }} сум</p>
                </div>
  
                <div>
                  <p class="text-sm text-gray-600 mb-1">Канал</p>
                  <div class="flex items-center gap-3">
                    <img 
                      v-if="campaign.result.source" 
                      class="w-8 h-8" 
                      :src="`/${campaign.result.source}.svg`" 
                      alt=""
                    />
                    <span class="text-xl capitalize text-gray-900">{{ campaign.source }}</span>
                  </div>
                </div>
  
                <div v-if="campaign.integration" class="md:col-span-2">
                  <p class="text-sm text-gray-600 mb-1">Интеграция</p>
                  <div class="flex items-center gap-2">
                    <p class="text-lg text-gray-900 font-medium">{{ campaign.integration.name }}</p>
                    <p class="text-gray-600">@{{ campaign.integration.username }}</p>
                  </div>
                </div>
  
                <div v-if="campaign.description" class="md:col-span-2">
                  <p class="text-sm text-gray-600 mb-2">Описание</p>
                  <div class="p-4 bg-gray-50 rounded-lg text-gray-700 text-sm leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {{ campaign.description }}
                  </div>
                </div>
              </div>
  
              <!-- Статистика -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                <div class="text-center p-4 bg-indigo-50 rounded-lg">
                  <p class="text-sm text-indigo-600 mb-1">Всего лидов</p>
                  <p class="text-3xl font-bold text-indigo-900">{{ pagination?.total || leads.length }}</p>
                </div>
                
                <div class="text-center p-4 bg-green-50 rounded-lg">
                  <p class="text-sm text-green-600 mb-1">Успешные сделки</p>
                  <p class="text-3xl font-bold text-green-900">{{ campaign.successful_deals_sum || 0 }} сум</p>
                </div>
                
                <div v-if="campaign.start_date" class="text-center p-4 bg-blue-50 rounded-lg">
                  <p class="text-sm text-blue-600 mb-1">Начало</p>
                  <p class="text-sm font-semibold text-blue-900">{{ formatDate(campaign.start_date) }}</p>
                </div>
                
                <div v-if="campaign.end_date" class="text-center p-4 bg-purple-50 rounded-lg">
                  <p class="text-sm text-purple-600 mb-1">Окончание</p>
                  <p class="text-sm font-semibold text-purple-900">{{ formatDate(campaign.end_date) }}</p>
                </div>
              </div>
            </div>
  
            <!-- Режим редактирования -->
            <form v-else @submit.prevent="updateCampaign" class="space-y-6">
              <div>
                <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
                  Название кампании
                </label>
                <input
                  id="name"
                  v-model="formData.name"
                  type="text"
                  required
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Введите название"
                />
              </div>
  
              <div>
                <label for="cost" class="block text-sm font-semibold text-gray-700 mb-2">
                  Стоимость (сум)
                </label>
                <input
                  id="cost"
                  v-model.number="formData.cost"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Введите стоимость"
                />
              </div>
  
              <!-- Сообщение об успехе -->
              <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                {{ successMessage }}
              </div>
  
              <!-- Сообщение об ошибке обновления -->
              <div v-if="updateError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {{ updateError }}
              </div>
  
              <!-- Кнопки действий -->
              <div class="flex gap-4">
                <button
                  type="submit"
                  :disabled="isUpdating"
                  class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span v-if="isUpdating">Сохранение...</span>
                  <span v-else>Сохранить изменения</span>
                </button>
                
                <button
                  type="button"
                  @click="cancelEdit"
                  class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Отменить
                </button>
              </div>
            </form>
          </div>
  
          <!-- Список лидов -->
          <div class="bg-white rounded-lg shadow-lg p-8">
            <!-- Заголовок с кнопкой переключения вида -->
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-gray-900">Лиды кампании</h2>
              
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
  
            <!-- Загрузка лидов -->
            <div v-if="isLoadingLeads" class="flex justify-center py-8">
              <div class="text-gray-600">Загрузка лидов...</div>
            </div>
  
            <!-- Ошибка загрузки лидов -->
            <div v-if="!isLoadingLeads && leadsError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {{ leadsError }}
            </div>
  
            <!-- Список лидов (режим списка) -->
            <div v-if="!isLoadingLeads && !leadsError && leads.length > 0 && !isGridView" class="space-y-4">
              <div
                v-for="lead in leads"
                :key="lead.id"
                class="p-5 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 mb-1">
                      {{ lead.name || 'Без имени' }}
                    </h3>
                    <p v-if="lead.phone" class="text-sm text-gray-600">
                      📞 {{ lead.phone }}
                    </p>
                  </div>
                  
                  <span 
                    v-if="lead.leadStatus"
                    :class="[
                      'px-3 py-1 rounded-full text-sm font-medium',
                      lead.leadStatus.is_success 
                        ? 'bg-green-100 text-green-800' 
                        : lead.leadStatus.is_failure
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    ]"
                  >
                    {{ lead.leadStatus.name }}
                  </span>
                </div>
  
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Менеджер</p>
                    <p class="text-sm font-medium text-gray-900">
                      {{ lead.manager?.name || 'Не назначен' }}
                    </p>
                  </div>
  
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Успешных сделок</p>
                    <p class="text-sm font-bold text-green-600">
                      {{ lead.successful_deals_count || 0 }}
                    </p>
                  </div>
  
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Дата создания</p>
                    <p class="text-sm text-gray-700">
                      {{ formatDate(lead.created_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Сетка лидов (режим сетки) -->
            <div v-if="!isLoadingLeads && !leadsError && leads.length > 0 && isGridView" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="lead in leads"
                :key="lead.id"
                class="p-5 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all bg-white"
              >
                <!-- Имя и статус -->
                <div class="mb-4">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2 truncate">
                    {{ lead.name || 'Без имени' }}
                  </h3>
                  
                  <span 
                    v-if="lead.leadStatus"
                    :class="[
                      'inline-block px-3 py-1 rounded-full text-xs font-medium',
                      lead.leadStatus.is_success 
                        ? 'bg-green-100 text-green-800' 
                        : lead.leadStatus.is_failure
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    ]"
                  >
                    {{ lead.leadStatus.name }}
                  </span>
                </div>

                <!-- Телефон -->
                <div v-if="lead.phone" class="mb-4 pb-4 border-b border-gray-200">
                  <p class="text-sm text-gray-600 flex items-center gap-2">
                    <span>📞</span>
                    <span class="truncate">{{ lead.phone }}</span>
                  </p>
                </div>

                <!-- Информация -->
                <div class="space-y-3">
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Менеджер</p>
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ lead.manager?.name || 'Не назначен' }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs text-gray-500 mb-1">Успешных сделок</p>
                    <p class="text-lg font-bold text-green-600">
                      {{ lead.successful_deals_count || 0 }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs text-gray-500 mb-1">Дата создания</p>
                    <p class="text-sm text-gray-700">
                      {{ formatDate(lead.created_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Нет лидов -->
            <div v-if="!isLoadingLeads && !leadsError && leads.length === 0" class="text-center py-12">
              <p class="text-gray-500 text-lg">Нет лидов для этой кампании</p>
            </div>

            <!-- Пагинация -->
            <div v-if="!isLoadingLeads && leads.length > 0 && pagination && pagination.last_page > 1" class="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
              <div class="text-sm text-gray-600">
                Страница {{ pagination.current_page }} из {{ pagination.last_page }} 
                (Всего: {{ pagination.total }})
              </div>
              <div class="flex gap-2">
                <button
                  @click="loadLeads(pagination.current_page - 1)"
                  :disabled="!pagination.prev_page_url"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Назад
                </button>
                <button
                  @click="loadLeads(pagination.current_page + 1)"
                  :disabled="!pagination.next_page_url"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Далее →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import axios from 'axios';
  
  const router = useRouter();
  const route = useRoute();
  
  const campaign = ref(null);
  const leads = ref([]);
  const pagination = ref(null);
  const isLoading = ref(true);
  const isLoadingLeads = ref(false);
  const isUpdating = ref(false);
  const isEditMode = ref(false);
  const isGridView = ref(false); // false = список, true = сетка
  const error = ref('');
  const leadsError = ref('');
  const updateError = ref('');
  const successMessage = ref('');
  
  const formData = reactive({
    name: '',
    cost: 0
  });
  
  // Функция для получения токена из cookies
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
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
  
  // Включить режим редактирования
  const toggleEditMode = () => {
    isEditMode.value = true;
    formData.name = campaign.value.name;
    formData.cost = campaign.value.cost || 0;
  };
  
  // Отменить редактирование
  const cancelEdit = () => {
    isEditMode.value = false;
    updateError.value = '';
    successMessage.value = '';
    formData.name = campaign.value.name;
    formData.cost = campaign.value.cost || 0;
  };
  
  // Получение токена
  const getAuthToken = () => {
    let token = getCookie('authToken');
    if (!token) {
      token = localStorage.getItem('authToken');
    }
    return token;
  };
  
  // Функция для получения деталей кампании
  const fetchCampaignDetails = async () => {
    try {
      isLoading.value = true;
      error.value = '';
  
      const token = getAuthToken();
      if (!token) {
        error.value = 'Токен не найден. Пожалуйста, войдите в систему.';
        return;
      }
  
      const campaignId = route.params.id;
      const response = await axios.get(
        `https://stage-back.shamcrm.com/api/advertising-campaigns/${campaignId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log('Детали кампании:', response.data);
      campaign.value = response.data;
      
      // Заполняем форму текущими данными
      formData.name = response.data.name;
      formData.cost = response.data.cost || 0;
  
      // Загружаем лиды
      await loadLeads();
  
    } catch (err) {
      if (err.response) {
        console.error('Ошибка ответа сервера:', err.response.data);
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
  
  // Функция для загрузки лидов кампании
  const loadLeads = async (page = 1) => {
    try {
      isLoadingLeads.value = true;
      leadsError.value = '';
  
      const token = getAuthToken();
      if (!token) {
        leadsError.value = 'Токен не найден. Пожалуйста, войдите в систему.';
        return;
      }
  
      const campaignId = route.params.id;
      const response = await axios.get(
        `https://stage-back.shamcrm.com/api/advertising-campaigns/${campaignId}/leads`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            page: page
          }
        }
      );
  
      console.log('Лиды кампании:', response.data);
  
      // Данные могут прийти в формате с пагинацией
      if (response.data.result && Array.isArray(response.data.result)) {
        // Формат: {result: Array, errors: null}
        leads.value = response.data.result;
        pagination.value = null;
        console.log('Формат: result Array, лидов:', leads.value.length);
      } else if (response.data.result && response.data.result.data) {
        leads.value = response.data.result.data;
        pagination.value = response.data.result.pagination || null;
        console.log('Формат 1: result.data, лидов:', leads.value.length);
      } else if (response.data.data) {
        leads.value = response.data.data;
        pagination.value = {
          current_page: response.data.current_page,
          total: response.data.total,
          per_page: response.data.per_page,
          last_page: response.data.last_page,
          prev_page_url: response.data.prev_page_url,
          next_page_url: response.data.next_page_url
        };
        console.log('Формат 2: data, лидов:', leads.value.length, 'всего:', pagination.value.total);
      } else if (Array.isArray(response.data)) {
        leads.value = response.data;
        pagination.value = null;
        console.log('Формат 3: Array, лидов:', leads.value.length);
      } else {
        leads.value = [];
        pagination.value = null;
        console.log('Формат неизвестен, данные:', response.data);
      }
  
    } catch (err) {
      if (err.response) {
        console.error('Ошибка загрузки лидов:', err.response.data);
        leadsError.value = `Ошибка: ${err.response.status}. ${err.response.data.message || 'Не удалось загрузить лиды'}`;
      } else if (err.request) {
        console.error('Ошибка запроса:', err.request);
        leadsError.value = 'Ошибка соединения. Проверьте интернет-подключение.';
      } else {
        console.error('Ошибка:', err.message);
        leadsError.value = 'Произошла ошибка при загрузке лидов.';
      }
    } finally {
      isLoadingLeads.value = false;
    }
  };
  
  // Функция обновления кампании
  const updateCampaign = async () => {
    try {
      isUpdating.value = true;
      updateError.value = '';
      successMessage.value = '';
  
      const token = getAuthToken();
      if (!token) {
        updateError.value = 'Токен не найден. Пожалуйста, войдите в систему.';
        return;
      }
  
      const campaignId = route.params.id;
      const response = await axios.patch(
        `https://stage-back.shamcrm.com/api/advertising-campaigns/${campaignId}`,
        {
          name: formData.name,
          cost: formData.cost
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log('Кампания обновлена:', response.data);
      
      // Обновляем данные кампании
      campaign.value = response.data;
      
      successMessage.value = 'Изменения успешно сохранены!';
      
      // Выходим из режима редактирования через 1.5 секунды
      setTimeout(() => {
        isEditMode.value = false;
        successMessage.value = '';
      }, 1500);
  
    } catch (err) {
      if (err.response) {
        console.error('Ошибка обновления:', err.response.data);
        updateError.value = `Ошибка: ${err.response.status}. ${err.response.data.message || 'Не удалось обновить данные'}`;
      } else if (err.request) {
        console.error('Ошибка запроса:', err.request);
        updateError.value = 'Ошибка соединения. Проверьте интернет-подключение.';
      } else {
        console.error('Ошибка:', err.message);
        updateError.value = 'Произошла ошибка при обновлении данных.';
      }
    } finally {
      isUpdating.value = false;
    }
  };
  
  // Возврат назад
  const goBack = () => {
    router.push('/home');
  };
  
  // Загружаем данные при монтировании компонента
  onMounted(() => {
    fetchCampaignDetails();
  });
  </script>