# Pruebas contra la BD real y repo publico

**Regla:** la BD de Supabase es la real del piloto: hay estudiantes y profesores reales con WhatsApp activado.
Para probar flujos (E2E, Playwright, API) usar SOLO las cuentas de prueba indicadas en la tarea de Tasknic
(FRE0002 tiene un estudiante y un profesor de prueba) y nunca reservar, escribir, valorar ni marcar favorito a
otro usuario.

**Por que:** cada reserva/mensaje dispara `insertNotification()` y WhatsApp al destinatario; una prueba contra un
profesor real le llega al movil.

**Como aplicar:**
- Prefijar todo dato creado con `QA-<codigo tarea>` y apuntar cada id creado para limpiarlo al final.
- Mutaciones minimas. La limpieza que la API no permite se hace con la service role desde un script local
  (fuera del repo), filtrando por id + cuentas de prueba + fecha, y avisando al usuario antes.
- Las pruebas suelen dejar slots huerfanos reservables (bugs de cancelacion/excepciones): revisar `lessons`
  tras cada sesion de pruebas.
- El repo es publico (decision 2026-10-19, no se va a privatizar): nunca escribir credenciales, ni detalles
  explotables de vulnerabilidades, en archivos versionados (codigo, memoria, PRPs, commits). Los informes de
  auditoria van a `docs/audits/` (local) y a Tasknic.
