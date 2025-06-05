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
    
      
      const response = await api.put<any>('/member-profiles', requestPayload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
  getMemberProfile: async (): Promise<any> => {
    try {
      const response = await api.get<any>('/member-profiles');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}; 