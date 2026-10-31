export interface GeneratedPhoto {
  id: string;
  blob: Blob;
  thumbnail?: Blob;
  timestamp: number;
  isFavorite: boolean;
  sourcePersonalPhotoId: string;
  sourceClothingDataUrl: string;
}

export interface SynthesisRequest {
  personalPhotoBlob: Blob;
  clothingDataUrl: string;
  apiKey: string;
  model: string;
}
