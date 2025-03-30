import { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const supabase = createClientComponentClient<Database>();

/**
 * Signs out the user from the Supabase authentication service.
 *
 * @return {Promise<void>} A promise that resolves when the user is signed out successfully.
 */
export const signOut = async () => {
  return await supabase.auth.signOut();
};
