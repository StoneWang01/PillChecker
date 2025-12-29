
export type AppLanguage = 'en' | 'zh-TW' | 'zh-CN';

export interface MedicationInfo {
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
  precautions: string;
  safetyAlert?: string;
  timestamp?: number;
}

export interface Reminder {
  id: string;
  medName: string;
  time: string;
  taken: boolean;
}

export interface HistoryItem {
  id: string;
  image: string;
  info: MedicationInfo;
  date: string;
}
