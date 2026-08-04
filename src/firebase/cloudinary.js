import { cloudinary } from "./config";

export function isCloudinaryConfigured() {
  return Boolean(cloudinary.cloudName && cloudinary.uploadPreset);
}

export async function uploadToCloudinary(file, folder = "", resourceType = "image") {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env.");
  }

  const endpointType = resourceType === "auto" ? "auto" : resourceType;
  const url = `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/${endpointType}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinary.uploadPreset);
  if (folder) {
    formData.append("folder", folder);
  }
  formData.append("resource_type", resourceType);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url;
}
