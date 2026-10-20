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

**Como se ataca (desde 2026-10-20):** un commit por hallazgo, marcado en el checklist de su WP con el hash; las
migraciones de WP1 son 028-038 (una por hallazgo, probadas en seco y con roles simulados antes de aplicar, con OK
del usuario). F021/F022 (curso como unidad de reserva) van con PRP propio; F036 sigue bloqueado por la decision de resenas. Hallazgo nuevo anadido: G-new-1
en FRE0012. El estado vivo esta en el borrador/comentarios de FRE0007, no aqui.

**Decisiones tomadas (2026-10-19):** el repo se queda publico (cuentas gratuitas para publicar); datos QA de la
auditoria borrados; keepalive de Supabase reactivado (moverlo a Vercel Cron va en FRE0017).
**Decisiones tomadas (2026-10-20):** curso = unidad de reserva al estilo italki (agenda general del tutor, el curso fija
precio y duracion, `course_id` en clase y reserva); cancelacion 24 h; horas convertidas a la zona del usuario (BD sigue
en Madrid); EUR para todo. Recogidas tambien en BUSINESS_LOGIC.md §5.
Las decisiones de producto que siguen pendientes estan listadas en FRE0007: preguntar, no inventar.
