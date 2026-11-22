-- Seguridad: Supabase expone automáticamente las tablas del esquema public en su Data API
-- (https://<ref>.supabase.co/rest/v1), accesible con la clave pública del navegador.
-- Activar RLS sin políticas bloquea por completo ese acceso para los roles anon y authenticated.
-- El backend se conecta como dueño de las tablas (rol postgres), que no queda restringido por RLS:
-- todo el acceso a datos pasa por la API, que verifica el usuario en cada consulta (ADR-011).
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prospect_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "practice_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "simulations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
