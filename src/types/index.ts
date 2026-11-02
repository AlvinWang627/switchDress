import type { ProviderId } from './provider';

export interface UserSettings {
  /** 目前選用的模型 ID；所屬供應商由模型 ID 決定 */
  model: string;
  /** 各供應商各自的 API Key，切換供應商時互不覆蓋 */
  apiKeys: Partial<Record<ProviderId, string>>;
}

export interface PersonalPhoto {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  uploadedAt: number;
}
