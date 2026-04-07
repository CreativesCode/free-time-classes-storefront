import type { User } from "@/types/user";
import { createClient } from "../client";

const supabase = createClient();

/**
 * Get current authenticated user.
 * When the caller already has the auth user id (e.g. from getSession()),
 * pass it via `knownUserId` to skip the extra auth round-trip.
 */
export async function getCurrentUser(
  knownUserId?: string
): Promise<User | null> {
  let userId = knownUserId;

  if (!userId) {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    userId = authUser?.id;
  }

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data as User;
}

/**
 * Get user by ID
 */
export async function getUser(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data as User;
}

/**
 * Update user
 */
export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as User;
}

/**
 * Check if user exists
 */
export async function userExists(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .single();

  return !error && data !== null;
}
