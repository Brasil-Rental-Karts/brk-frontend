import api from '../axios';

export interface MemberProfileUpdate {
  [key: string]: any;
}

export const ProfileService = {
  updateMemberProfile: async (data: MemberProfileUpdate): Promise<any> => {
    try {
      // Wrap the step data in a proper structure expected by the API
      const requestPayload = {
        profile: data
      };
      
      // Log the request payload for debugging
      console.log('Member profile update request payload:', requestPayload);
      
      const response = await api.put<any>('/member-profiles', requestPayload);
      return response.data;
    } catch (error: any) {
      // Log detailed error information
      console.error('Profile update error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }
}; 