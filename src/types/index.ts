export interface UserSettings {
  model: string;
  apiKey: string;
}

export interface PersonalPhoto {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  uploadedAt: number;
}
