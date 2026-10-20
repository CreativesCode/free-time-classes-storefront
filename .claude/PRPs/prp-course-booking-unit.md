# PRP-001: Curso como unidad de reserva (modelo italki) + publicar curso simplificado

> **Estado**: APROBADO (2026-10-20)
> **Fecha**: 2026-10-20
> **Proyecto**: Free Time Classes
> **Hallazgos**: FRE0013 F021 (alta), F022 (alta). Toca tambien F001, F012, F023, F050, F061, F062, F068 (ver Gotchas)

---

## Objetivo

El estudiante reserva **un curso** en un hueco de la **agenda general del tutor**: el curso fija precio, duracion y
materia, y la clase y la reserva quedan ligadas al curso (`course_id`). El tutor publica un curso en una sola hoja y,
si aun no tiene agenda, la define en el mismo flujo.

## Por Que

| Problema | Solucion |
|----------|----------|
| Precio y duracion del curso no son los que se reservan (curso 20 EUR/30 min, slot 10 EUR/60 min; reservas a 0 EUR) | El precio y la duracion de la clase salen siempre del curso en el momento de reservar |
| El tutor repite materia, duracion y precio en cada regla de disponibilidad | La agenda es solo franjas horarias (dia + inicio/fin); todo lo demas vive en el curso |
| Publicar un curso cuesta ~3 pantallas, 9 campos y termina en un "ya disponible" falso | Hoja unica: titulo, materia (alta inline), precio, duracion; paso 2 de agenda si no tiene; confirmacion con datos reales |
| Las valoraciones por curso nunca se actualizan (los triggers 010/018 esperan `lessons.course_id`) | `lessons.course_id` existe y los triggers empiezan a funcionar sin tocarlos |
| Slots pregenerados que caducan, se retiran y se "reabren" (F001, F012, `releaseLesson`) | La disponibilidad se calcula al vuelo: no hay slots que regenerar ni reabrir |

**Valor de negocio**: sin esto el piloto no es fiable (lo que se cobra no coincide con lo anunciado). Desbloquea el
PRP de pagos (el importe a cobrar es el del curso) y reduce el tiempo de alta del tutor de ~12 interacciones a ~5.

## Que

### Criterios de Exito
- [ ] Toda reserva nueva (slot o solicitud personalizada) crea `lessons` y `bookings` con `course_id`, y `price`/`duration_minutes` de la clase = los del curso en ese momento
- [ ] Un tutor con 2 cursos de 30 y 60 min y una franja lunes 10:00-12:00 ofrece 10:00/10:30/11:00/11:30 para el de 30 y 10:00/10:30/11:00 para el de 60; al reservar 10:00-11:00 desaparecen las horas que solapan en ambos cursos
- [ ] Dos reservas concurrentes que solapan para el mismo tutor: una gana y la otra recibe 409 (garantizado en BD, no solo en la API)
- [ ] Rechazar o cancelar una reserva libera el hueco sin reabrir ningun slot (la hora vuelve a aparecer porque se calcula)
- [ ] Un tutor sin cursos ni agenda publica su primer curso con agenda en una sola hoja; la confirmacion dice cuantas horas libres tiene y enlaza a "Ver curso"; un curso sin agenda lleva la insignia "sin horarios"
- [ ] Las escrituras de cursos pasan por `/api/courses` con validacion en servidor y `revalidateTag`; el cliente ya no puede escribir `courses` directo
- [ ] Al dejar una resena de una clase con curso, `courses.rating`/`total_reviews` se actualizan
- [ ] `npx tsc --noEmit` y `npm run lint` pasan; flujo tutor + estudiante verificado en navegador con cuentas de prueba (prefijo `QA-`, limpieza final)

### Comportamiento Esperado

**Tutor**
1. Pulsa "Publicar curso". Una hoja pide: titulo, materia (combobox; si no existe, se crea inline con `/api/subjects/create`), precio en EUR (obligatorio, sin 0 por defecto), duracion en chips, y opcionales nivel, descripcion y portada. Sin `max_students`.
2. Si el tutor no tiene ninguna franja, el paso 2 "Cuando puedes dar clase?" crea franjas semanales (dia + inicio/fin). Si ya tiene agenda, se muestra un resumen ("Tu agenda: 6 h/semana") con enlace para editarla. La agenda es **del tutor**, no del curso: sirve a todos sus cursos.
3. Confirmacion con datos reales: "Tu curso esta publicado. Proxima hora libre: lun 27/10 10:00" + "Ver curso". Sin agenda: CTA "Anadir horarios".
4. En "Mi agenda" gestiona franjas semanales y excepciones (bloquear dia/franja, franja extra puntual), sin materia/precio/duracion. El calendario muestra franjas y clases reservadas.

**Estudiante**
1. En el detalle del curso ve precio y duracion del curso y un selector por semanas con las horas de inicio en las que el curso **cabe entero** en la agenda del tutor (franjas + extras − bloqueos − clases ya comprometidas − antelacion minima).
2. Elige hora y reserva: se crea la clase (`scheduled`, ligada al curso) y la reserva `pending`; el tutor recibe la notificacion (in-app + WhatsApp) con el titulo del curso.
3. Si no hay horas: "Solicitar otra hora" (custom request del mismo curso) o "Escribir al tutor".
4. Mis Reservas, solicitudes del tutor y dashboards muestran el titulo del curso (fallback a la materia para clases historicas sin curso).

---

## Contexto

### Estado actual (investigado)
- **Slots pregenerados**: `tutor_availability` lleva `subject_id`, `duration_minutes`, `price` (migracion 004). `syncRuleSlots` (`src/lib/availability/syncRuleSlots.ts`) inserta `lessons` `available` a 12 semanas, al crear la regla y en el cron diario (`src/app/api/cron/daily/route.ts`). Las excepciones `extra` tambien llevan materia/duracion/precio y generan slots (`src/app/api/availability/exceptions/route.ts`).
- **Reserva**: `POST /api/bookings/request` recibe `lessonId`, pasa la leccion de `available` a `scheduled` y crea el booking `pending` sin `course_id`. `findScheduleConflict` (`src/lib/bookings/scheduleConflict.ts`) mira solapes con lecciones `scheduled`. Indice unico `lessons_tutor_start_live_key (tutor_id, scheduled_date_time) where status <> 'cancelled'` (033).
- **Liberar**: `releaseLesson` (`src/lib/bookings/releaseLesson.ts`) reabre a `available` si la regla sigue viva.
- **Custom request**: `bookings.requested_subject_id/_scheduled_date_time/_duration_minutes` (024); al aceptar, `respondToBooking` (`src/lib/bookings/respond.ts`) crea la leccion con precio de `tutor_profiles.hourly_rate` (null en todos → 0 EUR, F023).
- **Curso**: `courses` tiene `price_per_session`, `duration_minutes`, `max_students`, `subject_id`, `is_active`. CRUD directo desde el navegador (`src/lib/supabase/queries/courses.ts:298-345`, `TutorCoursesManager.tsx`), revalidacion via `/api/catalog/revalidate`.
- **Picker**: `BookingPicker` (`src/components/ds/BookingPicker.tsx`) pide `/api/lessons/available?tutorId&subjectId`, 14 dias, precio/duracion del slot. Solo carga para estudiantes logueados.
- **Valoraciones por curso**: los triggers de 010/018 infieren `reviews.course_id` desde `lessons.course_id` solo si la columna existe.
- **Codigo muerto previo** (no usado por ninguna pagina): `src/components/courses/CourseBookingSection.tsx`, `src/components/student/AvailabilityBrowser.tsx`, `src/components/teacher/AddAvailabilityModal.tsx`. Dependen del modelo de slots; se propone borrarlos en la fase 4/6 (pedir OK).
- **Datos en vivo**: no se pudieron consultar (el MCP de Supabase no tiene permiso sobre el proyecto). La fase 1 empieza contando lecciones `available` futuras, reglas activas, extras y reservas activas via `supabase db query`.

### Decision tecnica clave: disponibilidad calculada vs. slots pregenerados

| Opcion | Pros | Contras |
|--------|------|---------|
| **A. Calculada al vuelo (recomendada)** — la agenda son franjas; las horas libres se calculan por curso al pedirlas; la fila `lessons` se crea al reservar | Encaja con "agenda general" + cursos de distintas duraciones; elimina regeneracion, retirada y reapertura de slots (F001/F012/`releaseLesson`); precio siempre del curso; menos filas | Reescribe picker, reserva y gestion de agenda; el solape se protege con una restriccion de exclusion en BD |
| B. Slots pregenerados por curso (`course_id` en reglas, opcion A de la auditoria) | Menos cambio en el picker | Con 2 cursos en la misma franja se generan slots solapados que choca con el indice unico 033; reservar uno obliga a retirar los solapados de otros cursos; contradice "agenda general" |
| C. Slots base de 30 min y una clase consume N consecutivos | Reutiliza `lessons available` | Reservas multi-fila, liberacion y cancelacion complejas; duraciones de 45 min no encajan |

### Arquitectura Propuesta (estructura real del repo)
```
supabase/migrations/041_course_booking_unit.sql
src/lib/availability/
  ├── openStartTimes.ts      # NUEVO, puro: franjas + extras − bloqueos − ocupadas → horas de inicio (hora Madrid)
  ├── ruleExpansion.ts       # se reduce a expandir franjas por fecha (sin slots)
  └── syncRuleSlots.ts       # obsoleto con el modelo calculado: se retira (pedir OK)
src/lib/courses/validateCourse.ts   # NUEVO: validacion manual del payload de curso (sin Zod)
src/app/api/
  ├── availability/open-times/route.ts   # NUEVO: GET ?courseId&from&to → horas de inicio
  ├── availability/rules/, exceptions/   # solo franjas; dejan de generar/retirar lecciones
  ├── bookings/request/route.ts          # recibe { courseId, start }
  ├── bookings/custom-request/route.ts   # recibe { courseId, start } (ver pregunta 4)
  ├── courses/route.ts, courses/[id]/route.ts  # NUEVO: POST / PATCH / DELETE (archivar)
  ├── lessons/available/route.ts         # se retira cuando nada lo use
  └── cron/daily/route.ts                # deja de generar slots (sigue completando y purgando)
src/lib/bookings/respond.ts, releaseLesson.ts  # rechazar/cancelar → leccion cancelled; precio de custom = curso
src/components/teacher/TutorCoursesManager.tsx  # hoja "Publicar curso" de 2 pasos
src/components/teacher/RecurringAvailabilityManager.tsx, AvailabilityCalendar.tsx  # franjas sin precio/materia
src/components/ds/BookingPicker.tsx    # por courseId, paginado por semanas
messages/es.json, messages/en.json
```

### Modelo de Datos (migracion 041, borrador)
```sql
-- Curso en clase y reserva. RESTRICT: un curso con historial se archiva, no se borra (F062).
alter table public.lessons  add column course_id bigint references public.courses(id) on delete restrict;
alter table public.bookings add column course_id bigint references public.courses(id) on delete restrict;
create index on public.lessons (course_id);
create index on public.bookings (course_id);

-- La agenda es solo tiempo: materia/duracion/precio dejan de ser obligatorios (se borran en una migracion posterior).
alter table public.tutor_availability
  alter column subject_id drop not null,
  alter column duration_minutes drop not null,
  alter column price drop not null,
  drop constraint tutor_availability_window_fits_duration;
-- availability_exceptions: 'extra' ya no exige subject_id/duration_minutes/price (recrear el check).

-- Curso: valores validos (decisiones pendientes 5 y 6).
alter table public.courses
  add constraint courses_duration_chk check (duration_minutes in (30, 45, 60, 90, 120)),
  add constraint courses_price_chk check (price_per_session >= 0 and price_per_session <= 500);

-- Sin solapes del mismo tutor, garantizado en BD (no solo en findScheduleConflict).
create extension if not exists btree_gist;
alter table public.lessons add constraint lessons_tutor_no_overlap
  exclude using gist (
    tutor_id with =,
    tsrange(scheduled_date_time, scheduled_date_time + make_interval(mins => duration_minutes)) with &&
  ) where (status in ('scheduled', 'in_progress'));

-- Escrituras de cursos solo via /api/courses (service role); el cliente conserva SELECT.
-- Versionar las politicas de courses (hoy no estan en migraciones, F061/F103).

-- Retirar los slots pregenerados futuros sin reserva activa (cancelled, no delete: puede haber bookings historicos).
```

---

## Blueprint (Assembly Line)

> Solo fases. Las subtareas se generan al entrar en cada fase (bucle agentico).

### Fase 1: Base de datos (migracion 041)
**Objetivo**: `course_id` en `lessons` y `bookings`, agenda sin materia/precio/duracion, checks de curso, exclusion de solapes, escrituras de `courses` solo por service role, slots `available` futuros retirados.
**Validacion**: conteo previo de datos afectados; prueba en seco (`begin … rollback`) con roles simulados (anon / estudiante / tutor) y una insercion solapada que falla; OK del usuario antes de aplicar; `supabase db query` confirma columnas, constraints y politicas.

### Fase 2: Motor de horas libres
**Objetivo**: funcion pura que, dada agenda, excepciones, clases comprometidas, duracion del curso, rejilla y antelacion minima, devuelve las horas de inicio en hora de Madrid; expuesta en `GET /api/availability/open-times?courseId&from&to`.
**Validacion**: script de casos (franja 10-12 con cursos de 30/60, bloqueo parcial, extra puntual, clase reservada en medio, cambio de hora DST de marzo/octubre, servidor en UTC); `tsc` limpio.

### Fase 3: Reserva ligada al curso
**Objetivo**: `POST /api/bookings/request` con `{ courseId, start }` crea leccion + booking con `course_id` y valores del curso (con rollback y 409 por solape); custom request por curso; aceptar/rechazar/cancelar ya no reabren slots; el cron deja de generar slots; notificaciones con el titulo del curso.
**Validacion**: llamadas a la API con cuentas de prueba (reserva, doble reserva concurrente → 409, rechazo, cancelacion y la hora vuelve a salir); `tsc` + lint.

### Fase 4: Agenda del tutor
**Objetivo**: reglas y excepciones solo con tiempo (API + `RecurringAvailabilityManager`); el calendario del tutor muestra franjas y clases reservadas; avisar si un bloqueo cae sobre una clase ya reservada.
**Validacion**: navegador como tutor: crear/editar/borrar franja, bloquear un dia, franja extra; el picker del estudiante refleja los cambios.

### Fase 5: Publicar curso en una hoja (F022)
**Objetivo**: `/api/courses` (crear, editar, archivar) con validacion manual y `revalidateTag`; hoja unica con materia inline, precio obligatorio, chips de duracion, sin `max_students`; paso 2 de agenda si no tiene; confirmacion con proxima hora libre y "Ver curso"; insignia "sin horarios"; confirmacion al archivar. Textos en `es` y `en`.
**Validacion**: navegador como tutor nuevo de prueba: primer curso + agenda en una sola hoja, curso visible en el catalogo al momento.

### Fase 6: Experiencia del estudiante
**Objetivo**: `BookingPicker` por `courseId`, paginado por semanas, precio/duracion del curso, estado vacio con "Solicitar otra hora" / "Escribir al tutor"; Mis Reservas, solicitudes del tutor y dashboards muestran el curso (fallback a materia). Retirar `/api/lessons/available` y el codigo muerto si se aprueba.
**Validacion**: navegador como estudiante: reservar un curso de 60 min y comprobar precio, duracion y curso en Mis Reservas y en la vista del tutor.

### Fase 7: Validacion Final
**Objetivo**: sistema funcionando end-to-end y documentacion al dia.
**Validacion**:
- [ ] `npx tsc --noEmit` pasa
- [ ] `npm run lint` pasa
- [ ] `npm run build` exitoso
- [ ] Playwright: flujo tutor (publicar + agenda) y estudiante (reservar + cancelar), `es` y `en`, movil y desktop
- [ ] Resena de una clase con curso actualiza la valoracion del curso
- [ ] Datos `QA-` borrados; `BUSINESS_LOGIC.md` (flujo principal, paso 2) y checklist de FRE0013 actualizados con los commits

---

## Decisiones de producto (tomadas el 2026-10-20)

1. **Horas de inicio:** cada 30 min (:00/:30).
2. **Margen entre clases:** 0 min.
3. **Horizonte de reserva:** 8 semanas.
4. **Solicitudes personalizadas:** siempre ligadas a un curso (precio y duracion del curso). Cierra F023.
5. **Cursos gratis:** no; `price_per_session > 0` (F061).
6. **Duraciones permitidas:** 30/45/60/90/120 min.
7. **Curso con historial:** se archiva; borrado real solo si no tiene clases.
8. **Editar un curso con reservas futuras:** las ya hechas conservan precio y duracion (copiados en la clase).
9. **Horas libres sin login:** si; el login se pide al reservar.
10. **Clases grupales:** `max_students` oculto hasta que existan.
11. **Codigo muerto del modelo de slots** (`CourseBookingSection`, `AvailabilityBrowser`, `AddAvailabilityModal`): se borra dentro del PRP.

---

## Aprendizajes (Self-Annealing)

> Crece con cada error encontrado durante la implementacion.

---

## Gotchas

- [ ] Hora de negocio Madrid: el motor debe calcular "hoy", dias de la semana y DST con `src/lib/datetime/lessonTime.ts`, no con `new Date()` del servidor (Vercel en UTC). `ruleExpansion.ts` hoy usa hora local del servidor.
- [ ] Mostrar horas en la zona del usuario (decision 2026-10-20, F047/F051) no esta implementado: la API sigue devolviendo wall-clock Madrid; no mezclar esa conversion aqui salvo que se pida.
- [ ] La restriccion de exclusion necesita `btree_gist` y que no haya solapes previos en `scheduled`/`in_progress`: comprobarlo antes de aplicar.
- [ ] El indice unico 033 sigue siendo valido (mismo inicio), pero las lecciones `available` historicas deben quedar `cancelled` antes de que el motor nuevo cree clases en esas horas.
- [ ] Reservas `pending` ocupan el hueco (la leccion pasa a `scheduled` al solicitar, como hoy). La caducidad de pendientes (F014) sigue siendo otra decision.
- [ ] Clases y reservas historicas tienen `course_id` null: toda UI necesita fallback a la materia.
- [ ] `bookings` y `courses` quedan de solo lectura para el cliente: todo pasa por `/api/...` con service role y validacion manual.
- [ ] Notificaciones solo via `insertNotification()`; WhatsApp en try/catch.
- [ ] Relacion con otros WPs: F001 (cron de slots) y F012 (retirar slots) quedan sustituidos por el modelo calculado; F050/F051 (picker), F023, F061, F062 y F068 se cierran o cambian aqui. Marcarlo en sus checklists al cerrar.
- [ ] Pruebas solo con cuentas de prueba y prefijo `QA-`; nada explotable en archivos versionados.

## Anti-Patrones

- NO crear nuevos patrones si los existentes funcionan (route handler + service role, `insertNotification`, `revalidateTag`)
- NO ignorar errores de TypeScript ni usar `any`
- NO hardcodear strings de UI (claves en `es.json` y `en.json`) ni valores de negocio (rejilla, horizonte, duraciones en constantes)
- NO anadir Zod: validacion manual en los route handlers
- NO usar `rounded-md/lg/xl/2xl`
- NO comparar horas de clase con `new Date().toISOString()`

---

*PRP pendiente de aprobacion. No se ha modificado codigo.*
