# Memoria del Proyecto — Indice

> Archivos organizados por carpeta (tipo). Max 200 lineas.
> Gestionado por skill memory-manager. Auto-memory de Claude Code DESACTIVADO.
> Contexto de negocio en `BUSINESS_LOGIC.md`; stack y reglas en `CLAUDE.md` (no se duplican aqui).

## user/ — Sobre el usuario/equipo
- [Equipo y preferencias](user/team.md) — equipo tecnico, espanol en chat / ingles en codigo, conventional commits, Windows

## project/ — Proyectos y decisiones activas
- [Zona horaria Madrid](project/business-timezone-madrid.md) — scheduled_date_time es wall-clock Madrid; usar helpers de lessonTime.ts
- [Rediseno FreeTime](project/redesign-freetime.md) — fases 0–8 hechas, chrome legacy eliminada; deuda: Plus Jakarta, tokens morados, data-theme
- [WhatsApp con OpenWA](project/whatsapp-openwa.md) — outbound via insertNotification + webhook SI/NO; checklist de produccion pendiente
- [Capacitor modo servidor remoto](project/capacitor-mobile.md) — server.url, nada de export estatico; push sera Capacitor + FCM

## feedback/ — Correcciones y preferencias
- [Radios rounded-ft-*](feedback/freetime-radius-scale.md) — nunca rounded-md/lg/xl/2xl (legacy los infla a 24–64px)

## reference/ — Donde encontrar cosas
- [Mapa de docs/](reference/docs-map.md) — que doc esta vigente y cual es historico; docs/ no esta en git
- [Supabase setup](reference/supabase-setup.md) — claves, clientes, migraciones (ultima 027), keepalive, MCP token
- [Gotchas de OpenWA](reference/openwa-gotchas.md) — 10 errores tipicos (@lid, UUID de sesion, idempotencia...)
