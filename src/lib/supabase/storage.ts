import { createClient } from "./client";

const supabase = createClient();

/**
 * Upload avatar image to Supabase Storage
 * @param userId - User UUID
 * @param file - File to upload
 * @returns File path saved in bucket
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const preferredPath = `${userId}.${fileExt}`;
  const fallbackPath = `${userId}/${Date.now()}.${fileExt}`;

  // Prefer flat filename because many RLS policies for avatars
  // validate object.name against auth.uid() without folder support.
  const preferredUpload = await supabase.storage
    .from("avatars")
    .upload(preferredPath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

  if (!preferredUpload.error) {
    return preferredPath;
  }

  // Fallback for projects that use folder-based policies.
  const fallbackUpload = await supabase.storage
    .from("avatars")
    .upload(fallbackPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (fallbackUpload.error) {
    throw fallbackUpload.error;
  }

  return fallbackPath;
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

/**
 * Resuelve la portada de un curso: URL absoluta o ruta en bucket course_covers.
 */
export function getCourseCoverPublicUrl(
  pathOrUrl: string | null | undefined
): string | null {
  if (pathOrUrl == null || typeof pathOrUrl !== "string") return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return getPublicUrl("course_covers", trimmed);
}

/**
 * Sube la imagen de portada del curso (el curso ya debe existir; RLS exige tutor titular).
 */
export async function uploadCourseCover(
  courseId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${courseId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("course_covers")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (uploadError) {
    throw uploadError;
  }

  return filePath;
}
