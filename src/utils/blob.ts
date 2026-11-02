/** 將 Blob 轉為完整的 data URL（含 `data:<mime>;base64,` 前綴） */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** 將 data URL 去掉前綴，只留下 base64 本體 */
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1];
}

/** 將 base64 字串解碼為 Blob */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}
