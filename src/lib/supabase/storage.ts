import { createClient } from "./client";

const supabase = createClient();

/**
 * Upload avatar image to Supabase Storage
 * @param userId - User UUID
 * @param file - File to upload
 * @returns Public URL of the uploaded file
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Upload subject icon to Supabase Storage
 * @param subjectId - Subject ID
 * @param file - File to upload
 * @returns Public URL of the uploaded file
 */
export async function uploadSubjectIcon(
  subjectId: number,
  file: File
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${subjectId}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("subject_icons")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("subject_icons").getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Upload certification document to Supabase Storage
 * @param tutorId - Tutor UUID
 * @param file - File to upload
 * @returns Public URL of the uploaded file
 */
export async function uploadCertification(
  tutorId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${tutorId}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("certifications")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("certifications").getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Get public URL for a file in storage
 * @param bucket - Storage bucket name
 * @param path - File path in the bucket
 * @returns Public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}
