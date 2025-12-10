<template>
  <div
    class="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 p-5"
  >
    <div class="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Вход в систему</h1>
        <p class="text-sm text-gray-600">Введите ваши учетные данные</p>
      </div>

      <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
        <div class="flex flex-col gap-2">
          <label for="username" class="text-sm font-semibold text-gray-700">
            Логин
          </label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="Введите логин"
            :class="[
              'px-4 py-3 border-2 rounded-lg text-base transition-all outline-none',
              errors.username
                ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100',
            ]"
            @input="clearError('username')"
          />
          <span v-if="errors.username" class="text-xs text-red-500 -mt-1">
            {{ errors.username }}
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <label for="password" class="text-sm font-semibold text-gray-700">
            Пароль
          </label>
          <div class="relative">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Введите пароль"
              :class="[
                'w-full px-4 py-3 pr-12 border-2 rounded-lg text-base transition-all outline-none',
                errors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100',
              ]"
              @input="clearError('password')"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity text-lg"
              @click="showPassword = !showPassword"
            >
              <span v-if="showPassword">👁️</span>
              <span v-else>👁️‍🗨️</span>
            </button>
          </div>
          <span v-if="errors.password" class="text-xs text-red-500 -mt-1">
            {{ errors.password }}
          </span>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="mt-2 px-4 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-base font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <span v-if="isLoading">Вход...</span>
          <span v-else>Войти</span>
        </button>
      </form>

      <div
        v-if="generalError"
        class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center"
      >
        {{ generalError }}
      </div>
    </div>
  </div>
</template>
  
  <script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();

// Состояние формы
const formData = reactive({
  username: "",
  password: "",
});

// Ошибки валидации
const errors = reactive({
  username: "",
  password: "",
});

// Состояния UI
const showPassword = ref(false);
const isLoading = ref(false);
const generalError = ref("");

// Функция для сохранения токена в cookies
const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

// Очистка ошибки для конкретного поля
const clearError = (field) => {
  errors[field] = "";
  generalError.value = "";
};

// Валидация формы
const validateForm = () => {
  let isValid = true;

  if (!formData.username.trim()) {
    errors.username = "Логин обязателен для заполнения";
    isValid = false;
  } else if (formData.username.length < 3) {
    errors.username = "Логин должен содержать минимум 3 символа";
    isValid = false;
  }

  if (!formData.password.trim()) {
    errors.password = "Пароль обязателен для заполнения";
    isValid = false;
  } else if (formData.password.length < 4) {
    errors.password = "Пароль должен содержать минимум 4 символов";
    isValid = false;
  }

  return isValid;
};

// Обработка отправки формы
const handleLogin = async () => {
  // Очистка предыдущих ошибок
  errors.username = "";
  errors.password = "";
  generalError.value = "";

  // Валидация
  if (!validateForm()) {
    return;
  }

  // Начало загрузки
  isLoading.value = true;

  try {
    const response = await axios.post(
      "https://stage-back.shamcrm.com/api/login",
      {
        login: formData.username,
        password: formData.password,
      }
    );

    const data = response.data;

    // Успешный вход
    console.log("Вход выполнен успешно:", data);

    // Сохранение токена в localStorage и cookies
    if (data.token) {
      localStorage.setItem("authToken", data.token);
      setCookie("authToken", data.token, 1);
    }

    // Сохранение дополнительных данных пользователя
    if (data.user) {
      localStorage.setItem("userData", JSON.stringify(data.user));
    }

    if (data.permissions) {
      localStorage.setItem("userPermissions", JSON.stringify(data.permissions));
    }

    if (data.settings) {
      localStorage.setItem("userSettings", JSON.stringify(data.settings));
    }

    // Перенаправление на страницу /home
    router.push("/home");
  } catch (error) {
    // Обработка ошибок axios
    if (error.response) {
      // Ошибка от сервера
      generalError.value =
        error.response.data.message || "Неверный логин или пароль";
    } else if (error.request) {
      // Ошибка соединения
      generalError.value =
        "Произошла ошибка соединения. Проверьте интернет-подключение.";
    } else {
      // Другие ошибки
      generalError.value = "Произошла ошибка. Попробуйте еще раз.";
    }
    console.error("Ошибка входа:", error);
  } finally {
    isLoading.value = false;
  }
};
</script>
  
 