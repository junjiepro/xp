import { Database } from "@/types/database.types"
import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Signs out the user from the Supabase authentication service.
 *
 * @param {SupabaseClient<Database>} supabase - The Supabase client instance.
 * @return {Promise<void>} A promise that resolves when the user is signed out successfully.
 */
export const signOut = async (supabase: SupabaseClient<Database>) => {
  return await supabase.auth.signOut();
}

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

/**
 * Creates a new organization.
 *
 * @param {SupabaseClient<Database>} supabase - The Supabase client used to interact with the database.
 * @param {string} name - The name of the organization.
 * @param {string} created_by - The ID of the user who created the organization.
 * @return {Promise<any>} A promise that resolves with the result of the insert operation.
 */
export const createNewOrganization = async (supabase: SupabaseClient<Database>, name: string, created_by: string) => {
  return await supabase.from('organizations').insert({ name, created_by });
}

/**
 * Updates the user profile with the provided username.
 *
 * @param {SupabaseClient<Database>} supabase - The Supabase client object
 * @param {string} id - The id of the user profile to update
 * @param {string} username - The new username to set
 * @return {Promise<any>} The updated user profile object
 */
export const updateUserProfile = async (supabase: SupabaseClient<Database>, id: string, username: string) => {
  return await supabase.from('user_profiles').update({ username }).eq('id', id).select("*").single();
}