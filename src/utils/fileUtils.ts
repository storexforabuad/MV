
export const urlToFile = async (url: string, filename: string, mimeType?: string): Promise<File | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const type = mimeType || blob.type || 'image/jpeg';
    return new File([blob], filename, { type });
  } catch (error) {
    console.error('Error converting URL to File:', error);
    return null;
  }
};
