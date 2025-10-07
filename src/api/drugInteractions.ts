import { apiClient } from './client';

export interface DrugInteractionResult {
  interactionDetected: boolean;
  severity: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  description: string;
  saferAlternatives: string[];
  aiExplanation?: string;
  fdaSource?: any;
}

export interface DrugInteraction {
  id: string;
  drugsInvolved: string[];
  severity: string;
  description: string;
  saferAlternatives: string[];
  aiExplanation?: string;
  autoChecked: boolean;
  createdAt: string;
}

export const drugInteractionsApi = {
  check: (drugs: string[]) =>
    apiClient.post<DrugInteractionResult>('/drug-interactions/check', { drugs }),

  getHistory: () =>
    apiClient.get<DrugInteraction[]>('/drug-interactions/history'),

  getById: (id: string) =>
    apiClient.get<DrugInteraction>(`/drug-interactions/${id}`),
};
