import api from '../axios';

export interface OverduePayment {
  id: string;
  registrationId: string;
  billingType: string;
  value: number;
  dueDate: string;
  status: string;
  installmentNumber?: number;
  installmentCount?: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  paymentLink?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  registration?: {
    id: string;
    userId: string;
    seasonId: string;
    amount: number;
    paymentStatus: string;
    createdAt: string;
  };
}

export interface ReactivatePaymentRequest {
  newDueDate: string;
}

export interface ReactivatePaymentResponse {
  id: string;
  registrationId: string;
  billingType: string;
  value: number;
  dueDate: string;
  status: string;
  installmentNumber?: number;
  installmentCount?: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  paymentLink?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
}

export class PaymentManagementService {
  /**
   * Busca todos os pagamentos vencidos do sistema
   */
  static async getAllOverduePayments(): Promise<OverduePayment[]> {
    const response = await api.get('/payment-management/overdue-payments');
    return response.data.data;
  }

  /**
   * Busca pagamentos vencidos de uma inscrição
   */
  static async getOverduePayments(registrationId: string): Promise<OverduePayment[]> {
    const response = await api.get(`/payment-management/overdue-payments/${registrationId}`);
    return response.data.data;
  }

  /**
   * Reativa uma fatura vencida
   */
  static async reactivateOverduePayment(
    paymentId: string, 
    newDueDate: string
  ): Promise<ReactivatePaymentResponse> {
    const response = await api.post(`/payment-management/reactivate-payment/${paymentId}`, {
      newDueDate
    });
    return response.data.data;
  }
} 