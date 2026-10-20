# Supabase: claves, clientes, migraciones e infra

**Proyecto:** ref `nqetxsifeulhfkwjdsbp` (plan free). MCP configurado en `.mcp.json`; requiere la variable de
entorno `SUPABASE_ACCESS_TOKEN` en la maquina de cada dev (personal access token, nunca en el repo).
Ojo: en la maquina de Roberto ese `SUPABASE_ACCESS_TOKEN` es de otra cuenta y da 403 en este proyecto (el MCP
tampoco sirve); usar el CLI con `env -u SUPABASE_ACCESS_TOKEN supabase db query ...`. Ver `local-verification.md`.

**Claves:** el codigo usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato nuevo 2025) con fallback a
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (JWT legacy). `SUPABASE_SERVICE_ROLE_KEY` solo en route handlers (cliente admin).

**Clientes** (`src/lib/supabase/`): `client.ts` (browser, componentes `'use client'`), `server.ts` (cookies via
`next/headers`, solo route handlers/server), `server-public.ts` (lecturas publicas en server), `queries/` (cliente)
y `server-queries/` (server).

**Migraciones:** `supabase/migrations/NNN_descripcion.sql`, numeracion secuencial; la ultima es `042_course_writes_via_api.sql` (todas aplicadas en prod). Patron: probar en seco con `begin; ...; rollback;`, simular RLS con `set local role authenticated` + `request.jwt.claims`, y si una migracion restringe algo que el codigo desplegado aun usa, aplicarla DESPUES del deploy.
Hay dos `019_*` (prefijo duplicado historico, no renombrar). El esquema real difiere del SQL de
`docs/proyecto-maestro.md` §4 (ej. ids, `scheduled_date_time`, conversaciones): fiarse de las migraciones / MCP.

**Keepalive:** el plan free pausa el proyecto tras ~7 dias sin actividad. `.github/workflows/keep-supabase-alive.yml`
llama a diario (06:00 UTC) al RPC `public.ping()` (migracion `025`) con los secrets `SUPABASE_URL` y `SUPABASE_ANON_KEY` del repo.
Gotcha: GitHub desactiva los workflows programados tras 60 dias sin actividad en el repo (`disabled_inactivity`);
paso entre julio y octubre de 2026 y se reactivo el 2026-10-19 via API de GitHub. Plan: moverlo a Vercel Cron junto
con el cron diario (`/api/cron/daily`, que ya no genera huecos: completa clases y purga datos) (FRE0017).

**Acceso a datos reales:** la BD es la del piloto (usuarios reales). Ver `feedback/qa-testing-safety.md` antes de
probar flujos que escriban datos.

**Otras envs del proyecto:** `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` (Calendar/Meet), `OPENWA_*` (WhatsApp),
`CAPACITOR_SERVER_URL`, `CAPACITOR_ANDROID_CLEARTEXT`, `ENABLE_DEV_ROUTES` (solo local: `true` habilita `/api/dev/*` en `next dev`).

**Vercel:** el MCP de Vercel de esta maquina esta autenticado en OTRO equipo (no el de este proyecto): no usarlo aqui. Logs y crons se revisan desde el dashboard del usuario; `CRON_SECRET` no esta en `.env.local`, asi que el cron no se puede lanzar en local.
