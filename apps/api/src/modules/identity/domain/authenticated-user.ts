/** Identidad verificada a partir del JWT de Supabase Auth (`sub` y `email`). */
export type AuthenticatedUser = {
  id: string
  email: string | null
}
