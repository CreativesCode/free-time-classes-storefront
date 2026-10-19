---
name: primer
description: "Cargar contexto completo del proyecto al inicio de una conversacion. SIEMPRE activa la memoria persistente (memory-manager) como primer paso. Lee .claude/memory/MEMORY.md, CLAUDE.md, docs/proyecto-maestro.md, rutas y API existentes, y estado de la BD. Activar cuando el agente no tiene contexto del proyecto o el usuario dice: que tenemos, donde estamos, dame contexto, resumeme el proyecto."
allowed-tools: Read, Grep, Glob, Bash
---

# Primer: Contexto de Free Time Classes

Proyecto existente (no creado desde el scaffold de Titan Factory) que usa el toolbox de TF en `.claude/`.
El stack, la arquitectura y las reglas viven en `CLAUDE.md` — esa es la fuente de verdad, no el Golden Path generico de TF.

## Lo Que Ya Sabes

- **Producto:** marketplace de clases particulares online (profesores ↔ estudiantes). Web + Capacitor (Android/iOS).
- **Stack:** Next.js 15.2 App Router + React 19 + TS, next-intl (es/en), Tailwind 3.4 + shadcn/ui + DS FreeTime, Supabase, FullCalendar, Google Calendar/Meet, WhatsApp via OpenWA.
- **Rutas:** paginas en `src/app/[locale]/`, API en `src/app/api/` (sin locale).
- **Spec funcional:** `docs/proyecto-maestro.md` (local, ignorado por git).

### MCPs

| MCP | Uso |
|-----|-----|
| **Supabase** (`.mcp.json`, requiere env `SUPABASE_ACCESS_TOKEN`) | `list_tables`, `execute_sql`, `apply_migration`, `get_advisors`. Las migraciones ademas se guardan como archivo en `supabase/migrations/NNN_*.sql` |
| **Playwright** | Validacion visual y testing en browser real |

Si el MCP de Supabase no esta disponible, leer `supabase/migrations/` para inferir el esquema y decirlo en el resumen.

---

## Proceso de Contextualizacion

### 0. Sincronizar Repositorio y Activar Memoria Persistente (OBLIGATORIO — SIEMPRE PRIMERO)

#### 0a. Sincronizar con git (pull si es seguro)

1. Si no hay remoto configurado → omitir en silencio.
2. Si `git status --porcelain` muestra cambios sin commitear, o hay merge/rebase en curso → NO tocar el repo. Anotar: "pull pendiente, no aplicado por cambios locales sin commitear".
3. Working tree limpio: `git fetch` y comparar con upstream.
   - Sin commits nuevos → nada que reportar.
   - Commits nuevos y fast-forward puro → `git pull --ff-only`. Anotar: "repo actualizado, N commits nuevos".
   - Divergencia (commits locales sin pushear) → NO mergear. Anotar: "pull pendiente, requiere merge manual".
4. Si `fetch`/`pull` falla → no reintentar. Anotar: "pull pendiente, no se pudo verificar".

Nunca merge, rebase ni pull forzado — solo fast-forward limpio.

#### 0b. Activar memoria persistente

1. **Verificar setup:** `.claude/settings.json` con `"autoMemoryEnabled": false` (sin borrar los permisos que ya tenga) y `.claude/memory/MEMORY.md` + carpetas `user/`, `feedback/`, `project/`, `reference/`. Si falta algo → setup del skill `memory-manager`.
2. **Cargar memoria:** leer `.claude/memory/MEMORY.md`. Si un tema es relevante al trabajo actual, leer su archivo de detalle.
3. **Queda activo el resto de la sesion** con las reglas de `memory-manager`.

NO continuar al paso 1 sin haber leido MEMORY.md.

### 1. Leer Identidad y Reglas

Leer `CLAUDE.md` (stack, arquitectura, reglas criticas) y `BUSINESS_LOGIC.md` (problema, roles, reglas de negocio, estado por modulo). Si existe, ojear `docs/proyecto-maestro.md` §20–21 (estado de implementacion y prioridades) — pero contrastar con el codigo: el doc puede ir por detras.

### 2. Mapear Estado de BD

Con el MCP de Supabase: `list_tables` (tablas, filas, RLS). Sin MCP: listar `supabase/migrations/` y reportar la ultima migracion.

### 3. Escanear Rutas y API

- Paginas: `src/app/[locale]/**/page.tsx`
- API: `src/app/api/**/route.ts`
- Ultimos commits: `git log --oneline -10`

### 4. Entregar Resumen

```markdown
# Free Time Classes

## Proposito
[1-2 lineas]

## Estado Actual
### Base de Datos
| Tabla | Registros | RLS |   (o: "ultima migracion: NNN_xxx.sql")

### Rutas
- `/[locale]/...` -> [descripcion]

### API
- `POST /api/...` -> [que hace]

### Ultimo trabajo
[resumen de los ultimos commits]

## Memoria Persistente
Activa (.claude/memory/) — [N memorias cargadas]

[Solo si 0a genero nota:]
## Sincronizacion
[repo actualizado / pull pendiente: razon]

## Listo para trabajar
En que te ayudo?
```
