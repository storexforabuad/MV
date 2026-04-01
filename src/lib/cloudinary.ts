export async function uploadImageToCloudinary(file: File, storeId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!uploadPreset || !cloudName) {
      reject(new Error('Cloudinary environment variables are not set correctly.'));
      return;
    }

    formData.append('upload_preset', uploadPreset);
    // Use storeId as a prefix in the public_id
    const publicId = `${storeId}_${file.name.replace(/\.[^/.]+$/, '')}_${Date.now()}`;
    formData.append('public_id', publicId);

    console.log('Uploading to Cloudinary with the following details:');
    console.log('Cloud Name:', cloudName);
    console.log('Upload Preset:', uploadPreset);

    fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        if (data.secure_url) {
          console.log('Image uploaded successfully:', data.secure_url); // Log the secure URL
          resolve(data.secure_url);
        } else {
          console.error('Failed to upload image:', data); // Log the error response
          reject(new Error('Failed to upload image'));
        }
      })
      .catch(error => {
        console.error('Error uploading image:', error); // Log the error
        reject(error);
      });
  });
}
