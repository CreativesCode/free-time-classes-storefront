# Mapa de docs/ y su vigencia

`docs/` esta en `.gitignore` (`docs/**`): solo existe en local, otros devs pueden no tenerlo.
Lo esencial esta destilado en `BUSINESS_LOGIC.md`, `CLAUDE.md` y estas memorias.

| Doc | Contenido | Vigencia |
|-----|-----------|----------|
| `proyecto-maestro.md` | Spec funcional: 14 modulos, reglas Capacitor, esquema SQL inicial, envs, estado y sprints | Vigente como spec; estado a marzo 2026 (por detras del codigo). El SQL es orientativo |
| `design/REDESIGN.md` | Roadmap del rediseno FreeTime (tokens, fases 0–8, deuda de limpieza) | Vigente; la parte del registry de rutas esta obsoleta |
| `design/*.jsx`, `index.html` | Prototipo visual (mobile + `desktop.jsx`) | Referencia visual |
| `OPENWA_IMPLEMENTATION_PLAN.md` | Plan e implementacion WhatsApp (fases 1 y 2) | Vigente |
| `OPENWA_INTEGRATION_GUIDE.md` | Guia generica de OpenWA + gotchas + codigo de referencia | Referencia |
| `PERFORMANCE_AUDIT.md` | Auditoria de rendimiento 2026-03-30 + segunda ronda (todo ✅) | Historico; util antes de optimizar |
| `auditoria-capacitor.md` | Auditoria Capacitor 2026-03-20 | Mayormente resuelta (server.url, API fuera de locale) |
| `instructions.md` | Migracion Django → Supabase (esquema original) | Historico |
| `migration-analysis.md` | Analisis de migracion Django/GraphQL/Apollo → Supabase | Historico (Apollo ya eliminado) |
| `que-ver-al-levantar.md` | Guia de arranque de la epoca de la migracion | Historico |

Historia: el proyecto empezo con backend Django + GraphQL (Apollo, JWT en localStorage) y se migro a Supabase.
Si aparece `src/graphql/` o restos de Apollo, son legacy.
