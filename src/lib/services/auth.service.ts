import api from "../axios";

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
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResult {
  firstLogin?: boolean;
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

// Get the frontend URL for redirects
const getFrontendUrl = () => {
  // Use the current origin (protocol + hostname + port) as the frontend URL
  return window.location.origin;
};

export const AuthService = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/auth/register", data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<LoginResult> => {
    const response = await api.post<LoginResult>("/auth/login", data);
    return response.data;
  },

  forgotPassword: async (
    data: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> => {
    const response = await api.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      data,
    );
    return response.data;
  },

  resetPassword: async (
    data: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> => {
    const response = await api.post<ResetPasswordResponse>(
      "/auth/reset-password",
      data,
    );
    return response.data;
  },

  getGoogleAuthUrl: async (): Promise<GoogleAuthUrlResponse> => {
    // Include the frontend redirect URLs as query parameters
    const frontendRedirectUrl = `${getFrontendUrl()}/login-success`;
    const frontendErrorRedirectUrl = `${getFrontendUrl()}/login-error`;

    const response = await api.get<GoogleAuthUrlResponse>(
      `/auth/google/url?redirectUrl=${encodeURIComponent(frontendRedirectUrl)}&errorRedirectUrl=${encodeURIComponent(frontendErrorRedirectUrl)}`,
    );
    return response.data;
  },

  // Calls /auth/me to get the current authenticated user
  me: async (): Promise<{ id: string; email: string; role: string }> => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Calls backend to logout and clear cookies
  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  // Calls backend to refresh the access token using the refresh token
  refreshToken: async (): Promise<void> => {
    try {
      await api.post("/auth/refresh-token", {});
    } catch (error) {
      // Always throw a generic message for the user
      throw new Error("Sua sessão expirou. Faça login novamente.");
    }
  },

  confirmEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/auth/confirm-email",
      { token },
    );
    return response.data;
  },
};
