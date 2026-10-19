# Supabase: claves, clientes, migraciones e infra

**Proyecto:** ref `nqetxsifeulhfkwjdsbp` (plan free). MCP configurado en `.mcp.json`; requiere la variable de
entorno `SUPABASE_ACCESS_TOKEN` en la maquina de cada dev (personal access token, nunca en el repo).

**Claves:** el codigo usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato nuevo 2025) con fallback a
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (JWT legacy). `SUPABASE_SERVICE_ROLE_KEY` solo en route handlers (cliente admin).

**Clientes** (`src/lib/supabase/`): `client.ts` (browser, componentes `'use client'`), `server.ts` (cookies via
`next/headers`, solo route handlers/server), `server-public.ts` (lecturas publicas en server), `queries/` (cliente)
y `server-queries/` (server).

**Migraciones:** `supabase/migrations/NNN_descripcion.sql`, numeracion secuencial; la ultima es `027_whatsapp_inbound.sql`.
Hay dos `019_*` (prefijo duplicado historico, no renombrar). El esquema real difiere del SQL de
`docs/proyecto-maestro.md` §4 (ej. ids, `scheduled_date_time`, conversaciones): fiarse de las migraciones / MCP.

**Keepalive:** el plan free pausa el proyecto tras ~7 dias sin actividad. `.github/workflows/keep-supabase-alive.yml`
llama a diario (06:00 UTC) al RPC `public.ping()` (migracion `025`) con los secrets `SUPABASE_URL` y `SUPABASE_ANON_KEY` del repo.

**Otras envs del proyecto:** `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` (Calendar/Meet), `OPENWA_*` (WhatsApp),
`BOOKING_STUDENT_CANCEL_HOURS` (opcional, def. 24), `CAPACITOR_SERVER_URL`, `CAPACITOR_ANDROID_CLEARTEXT`.
