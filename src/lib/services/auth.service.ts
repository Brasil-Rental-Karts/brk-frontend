import api from '../axios';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
  recaptchaToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
  recaptchaToken?: string;
}

export interface ChangePasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export const AuthService = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },
  
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await api.post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const response = await api.post<ResetPasswordResponse>('/auth/reset-password', data);
    return response.data;
  },
  
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', data);
    return response.data;
  },
  
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await api.post<ChangePasswordResponse>('/auth/reset-password', data);
    return response.data;
  }
}; 