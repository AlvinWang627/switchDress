/** 圖片合成供應商 ID */
export type ProviderId = 'gemini' | 'openrouter';

/** 合成結果（各供應商共用） */
export interface SynthesisResult {
  success: boolean;
  imageBlob?: Blob;
  error?: string;
}

/** 模型下拉選項 */
export interface ModelOption {
  /** 送給 API 的 model 字串 */
  value: string;
  /** 下拉選單顯示名稱 */
  label: string;
}
