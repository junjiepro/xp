import { Database } from "@/types/database.types"
import { SupabaseClient } from "@supabase/supabase-js"


/**
 * Retrieves the user profile for the given user ID from the 'user_profiles' table in the Supabase database.
 *
 * @param {SupabaseClient<Database>} supabase - The Supabase client used to interact with the database.
 * @param {string} id - The ID of the user whose profile is being retrieved.
 * @return {Promise<Object>} A promise that resolves to the user profile object, or null if no profile is found.
 */
export const getCurrentUserProfile = async (supabase: SupabaseClient<Database>, id: string) => {
  return await supabase.from('user_profiles').select("*").eq('id', id).single()
}

/**
 * Retrieves the organizations that the current user belongs to.
 *
 * @param {SupabaseClient<Database>} supabase - The Supabase client used to interact with the database.
 * @param {string} id - The ID of the current user.
 * @return {Promise<any>} A promise that resolves to an array of organization objects.
 */
export const getCurrentUserOrganizations = async (supabase: SupabaseClient<Database>, id: string) => {
  const { data: roles } = await supabase
    .from('roles')
    .select(`
      organization_id,
      user_and_roles (
        user_id
      )
    `)
    .eq("user_and_roles.user_id", id)
    .eq("name", "User")
  return await supabase.from('organizations').select("*").in('id', roles?.map(r => r.organization_id) || [])
}