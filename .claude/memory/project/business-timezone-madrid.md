# Zona horaria de negocio: Europe/Madrid

`lessons.scheduled_date_time` (y `bookings.requested_scheduled_date_time`) son `timestamp without time zone`
y guardan la hora de pared de Madrid sin offset (ej. `2026-04-22 09:00:00`). Postgres esta en UTC.

**Por que importa:** Vercel corre en UTC y los slots se introducen en hora de Madrid. Comparar con
`new Date().toISOString()` o la hora local del servidor produce un desfase que mete slots pasados en
"clases disponibles" (o esconde futuros).

**Como aplicar:** para cualquier comparacion con "ahora" usar los helpers de `src/lib/datetime/lessonTime.ts`
(`BUSINESS_TIMEZONE`, `nowAsLessonTimestamp()`, `nowPlusMinutesAsLessonTimestamp()`,
`startOfMonthAsLessonTimestamp`, `isLessonInPast`), que formatean con `Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' })`.
Aplica a: `/api/lessons/available`, dashboards, "Mis clases", filtro "hoy" del tutor, expiracion de custom requests,
mensajes de WhatsApp (formatear horas en Madrid) y cualquier filtro nuevo por hora de clase.
