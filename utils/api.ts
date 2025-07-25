import AsyncStorage from '@react-native-async-storage/async-storage';

// Конфигурация API
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

// Типы для API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  birthDate: string;
  status: 'player' | 'coach' | 'scout';
  country?: string;
  team?: string;
  position?: string;
}

export interface Player {
  _id: string;
  username: string;
  name: string;
  status: 'player' | 'coach' | 'scout' | 'star';
  birthDate: string;
  country: string;
  city?: string;
  team?: string;
  position?: string;
  number?: string;
  grip?: string;
  height?: number;
  weight?: number;
  games?: number;
  goals?: number;
  assists?: number;
  points?: number;
  pullUps?: number;
  pushUps?: number;
  plankTime?: number;
  sprint100m?: number;
  longJump?: number;
  hockeyStartDate?: string;
  favoriteGoals?: string[];
  avatar?: string;
  photos?: string[];
  bio?: string;
  friends?: Player[];
  followers?: Player[];
  following?: Player[];
  isPublic: boolean;
  allowMessages: boolean;
  allowFriendRequests: boolean;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
  age?: number;
  hockeyExperience?: string;
}

// Класс для работы с API
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Получение токена из хранилища
  private async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  // Сохранение токена
  private async setToken(token: string): Promise<void> {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  // Удаление токена
  private async removeToken(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  // Базовый метод для HTTP запросов
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getToken();
      const url = `${this.baseURL}${endpoint}`;

      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Ошибка сети',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: 'Ошибка подключения к серверу',
      };
    }
  }

  // Аутентификация
  async login(credentials: LoginRequest): Promise<ApiResponse<{ token: string; player: Player }>> {
    const response = await this.request<{ token: string; player: Player }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      await this.setToken(response.data.token);
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<{ token: string; player: Player }>> {
    const response = await this.request<{ token: string; player: Player }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      await this.setToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    if (response.success) {
      await this.removeToken();
    }

    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<{ player: Player }>> {
    return this.request<{ player: Player }>('/auth/me');
  }

  async updateProfile(profileData: Partial<Player>): Promise<ApiResponse<{ player: Player }>> {
    return this.request<{ player: Player }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Игроки
  async getPlayers(page: number = 1, limit: number = 20, filters?: any): Promise<ApiResponse<{ players: Player[]; total: number }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request<{ players: Player[]; total: number }>(`/players?${params}`);
  }

  async getPlayer(id: string): Promise<ApiResponse<{ player: Player }>> {
    return this.request<{ player: Player }>(`/players/${id}`);
  }

  async searchPlayers(query: string): Promise<ApiResponse<{ players: Player[] }>> {
    return this.request<{ players: Player[] }>(`/players/search?q=${encodeURIComponent(query)}`);
  }

  async getStars(): Promise<ApiResponse<{ players: Player[] }>> {
    return this.request<{ players: Player[] }>('/players/stars');
  }

  // Друзья
  async getFriends(): Promise<ApiResponse<{ friends: Player[] }>> {
    return this.request<{ friends: Player[] }>('/friends');
  }

  async sendFriendRequest(playerId: string): Promise<ApiResponse> {
    return this.request(`/friends/request/${playerId}`, {
      method: 'POST',
    });
  }

  async acceptFriendRequest(playerId: string): Promise<ApiResponse> {
    return this.request(`/friends/accept/${playerId}`, {
      method: 'POST',
    });
  }

  async declineFriendRequest(playerId: string): Promise<ApiResponse> {
    return this.request(`/friends/decline/${playerId}`, {
      method: 'POST',
    });
  }

  async removeFriend(playerId: string): Promise<ApiResponse> {
    return this.request(`/friends/remove/${playerId}`, {
      method: 'DELETE',
    });
  }

  // Сообщения
  async getMessages(chatId: string, page: number = 1): Promise<ApiResponse<{ messages: any[]; total: number }>> {
    const params = new URLSearchParams({
      page: page.toString(),
    });

    return this.request<{ messages: any[]; total: number }>(`/messages/${chatId}?${params}`);
  }

  async sendMessage(chatId: string, text: string): Promise<ApiResponse<{ message: any }>> {
    return this.request<{ message: any }>(`/messages/${chatId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getChats(): Promise<ApiResponse<{ chats: any[] }>> {
    return this.request<{ chats: any[] }>('/messages/chats');
  }

  // Уведомления
  async getNotifications(page: number = 1): Promise<ApiResponse<{ notifications: any[]; total: number }>> {
    const params = new URLSearchParams({
      page: page.toString(),
    });

    return this.request<{ notifications: any[]; total: number }>(`/notifications?${params}`);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Загрузка файлов
  async uploadImage(file: any, type: 'avatar' | 'photo' = 'photo'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    const token = await this.getToken();
    const url = `${this.baseURL}/upload/image`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Ошибка загрузки',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Upload Error:', error);
      return {
        success: false,
        error: 'Ошибка загрузки файла',
      };
    }
  }

  // Проверка подключения
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Получение URL для Socket.IO
  getSocketUrl(): string {
    return SOCKET_URL;
  }

  // Проверка авторизации
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    try {
      const response = await this.getCurrentUser();
      return response.success;
    } catch {
      return false;
    }
  }
}

// Экспорт экземпляра API клиента
export const api = new ApiClient(API_BASE_URL);

// Экспорт типов
export type { Player, LoginRequest, RegisterRequest, ApiResponse }; 