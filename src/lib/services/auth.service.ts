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
  firstLogin?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface GoogleAuthUrlResponse {
  url: string;
}

export interface GoogleAuthResponse {
  idToken: string;
}

// Get the frontend URL for redirects
const getFrontendUrl = () => {
  // Use the current origin (protocol + hostname + port) as the frontend URL
  return window.location.origin;
};

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
  
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', data);
    return response.data;
  },
  
  resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const response = await api.post<ResetPasswordResponse>('/auth/reset-password', data);
    return response.data;
  },

  getGoogleAuthUrl: async (): Promise<GoogleAuthUrlResponse> => {
    // Include the frontend redirect URLs as query parameters
    const frontendRedirectUrl = `${getFrontendUrl()}/login-success`;
    const frontendErrorRedirectUrl = `${getFrontendUrl()}/login-error`;
    
    const response = await api.get<GoogleAuthUrlResponse>(
      `/auth/google/url?redirectUrl=${encodeURIComponent(frontendRedirectUrl)}&errorRedirectUrl=${encodeURIComponent(frontendErrorRedirectUrl)}`
    );
    return response.data;
  },

  authenticateWithGoogle: async (): Promise<LoginResponse> => {
    const response = await api.get<LoginResponse>('/auth/google');
    return response.data;
  },

  handleGoogleCallback: async (code: string): Promise<void> => {
    // This function is no longer needed as the backend will handle the redirect
    // with tokens directly to the login-success page
    await api.get(`/auth/google/callback?code=${code}`);
  }
}; 