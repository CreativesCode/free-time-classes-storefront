# Auditoria pre-piloto FRE0002 y plan de correccion

Auditoria general del 2026-10-19 (tarea Tasknic FRE0002): 14 auditores (9 de codigo + 5 E2E en navegador con las
cuentas de prueba de FRE0002), 5 auditorias de huecos y verificacion adversarial de cada hallazgo. Resultado:
135 hallazgos (7 criticos, 28 altos, 58 medios, 42 bajos). Veredicto: **no listo para el piloto** hasta cerrar la Fase 0.

**Donde esta el detalle:** `docs/audits/2026-10-19-FRE0002-auditoria.md` (plan completo: metricas, estrategia de
cache, flujo de cursos propuesto, fases) y `docs/audits/2026-10-19-FRE0002-findings.json` (hallazgos en bruto con
evidencias y votos). Ambos son locales (docs/ no va a git) porque el repo es publico: los detalles de seguridad
NO se copian aqui ni a ningun archivo versionado.

**Seguimiento (estado siempre en vivo en Tasknic, nunca copiado aqui):**
- FRE0007: tarea padre del plan (contexto, orden de ataque, decisiones de producto pendientes)
- FRE0008 WP1 Seguridad BD/RLS · FRE0009 WP2 Auth y sesion · FRE0010 WP3 Google Calendar/Meet
- FRE0011 WP4 Disponibilidad y slots · FRE0012 WP5 Ciclo de reservas · FRE0013 WP6 Flujo de cursos
- FRE0014 WP7 Cache y rendimiento · FRE0015 WP8 Mensajeria, notificaciones y WhatsApp
- FRE0016 WP9 i18n, DS y UX · FRE0017 WP10 Operacion y produccion
Cada WP lleva un checklist por fase con ids de hallazgo (F0xx / G-xxx), evidencia `archivo:linea` y fix propuesto.
Al cerrar un item: marcarlo en la descripcion de su WP y citar el commit.

**Orden de ataque acordado:** Fase 0 transversal primero, empezando por una migracion `028` (WP1); luego cron de
slots + completado (WP4/WP5), Cancelar/Rechazar via API (WP5), crash del catalogo e invalidacion de cache
(WP6/WP7), i18n bajo /es (WP9), sesion (WP2), OAuth Google (WP3) y timeout de OpenWA (WP8). Despues Fases 1-3.

**Problemas estructurales a recordar (no explotables):**
- Los slots (`lessons`) se generan una sola vez a 12 semanas y nada los renueva: hace falta un cron diario
  idempotente en hora de Madrid, que tambien marque clases `completed` y caduque pendientes.
- Curso y slot no estan vinculados (las lecciones no tienen `course_id`): precio/duracion mostrados en el curso no
  son los reservados. Es decision de producto (opcion A: `course_id` en reglas/lecciones/reservas; B: quitar
  precio/duracion del curso).
- Las caches del catalogo (`unstable_cache`/ISR) no se invalidan nunca: cualquier mutacion de cursos/perfil debe
  llamar a `revalidateTag`.
- Varias acciones de UI escriben directo en Supabase saltandose las rutas `/api/...` (y con ello notificaciones y
  reglas): al arreglar, pasar siempre por la API existente.

**Decisiones tomadas (2026-10-19):** el repo se queda publico (cuentas gratuitas para publicar); datos QA de la
auditoria borrados; keepalive de Supabase reactivado (moverlo a Vercel Cron va en FRE0017).
Las 16 decisiones de producto pendientes estan listadas en FRE0007: preguntar, no inventar.
