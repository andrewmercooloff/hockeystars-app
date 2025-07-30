// Базовый URL для API
const API_BASE_URL = 'https://your-api-url.com/api';

// Типы для API ответов
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Базовые функции для работы с API
export const api = {
  // GET запрос
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ API GET Error:', error);
      return {
        success: false,
        error: 'Ошибка сети',
      };
    }
  },

  // POST запрос
  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ API POST Error:', error);
      return {
        success: false,
        error: 'Ошибка сети',
      };
    }
  },

  // PUT запрос
  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ API PUT Error:', error);
      return {
        success: false,
        error: 'Ошибка сети',
      };
    }
  },

  // DELETE запрос
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ API DELETE Error:', error);
      return {
        success: false,
        error: 'Ошибка сети',
      };
    }
  },
};

export default api; 