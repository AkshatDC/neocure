import { apiClient } from './client';

export interface Prescription {
  id: string;
  userId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';
  notes?: string;
  createdAt: string;
}

export interface InteractionWarning {
  detected: boolean;
  severity?: string;
  description?: string;
  saferAlternatives?: string[];
  aiExplanation?: string;
  interactionId?: string;
  message?: string;
}

export interface AddPrescriptionResponse {
  prescription: Prescription;
  interactionWarning: InteractionWarning;
}

export const prescriptionsApi = {
  getAll: (status?: string) =>
    apiClient.get<Prescription[]>(`/prescriptions${status ? `?status=${status}` : ''}`),

  add: (data: {
    userId: string;
    drugName: string;
    dosage: string;
    frequency: string;
    endDate?: string;
    notes?: string;
  }) => apiClient.post<AddPrescriptionResponse>('/prescriptions/add', data),

  update: (id: string, data: Partial<Prescription>) =>
    apiClient.put<Prescription>(`/prescriptions/${id}`, data),

  discontinue: (id: string) =>
    apiClient.post<Prescription>(`/prescriptions/${id}/discontinue`, {}),
};
