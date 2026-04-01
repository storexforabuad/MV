export async function uploadImageToCloudinary(file: File, storeId: string): Promise<string> {
  if (!storeId) throw new Error('Missing storeId for image upload');

  // Generate a unique filename with storeId prefix
  const originalName = file.name;
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const prefixedFilename = `${storeId}_${uniqueSuffix}${extension}`;

  const formData = new FormData();
  formData.append('file', file, prefixedFilename);
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!uploadPreset || !cloudName) {
    throw new Error('Cloudinary environment variables are not set correctly.');
  }

  formData.append('upload_preset', uploadPreset);
  // No folder, just filename prefix

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (data.secure_url) {
    console.log('Image uploaded successfully:', data.secure_url);
    return data.secure_url;
  } else {
    console.error('Failed to upload image:', data);
    throw new Error('Failed to upload image');
  }
}
