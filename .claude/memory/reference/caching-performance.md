# Cache y rendimiento: como esta montado (FRE0014)

**Catalogo publico (ISR).** Home, `/courses`, `/tutors` usan `unstable_cache` con tags; `courses/[id]` y
`tutors/[id]` son ISR por ruta. Gotcha Next 15: una ruta con segmento dinamico solo es ISR si exporta
`generateStaticParams()` (aunque devuelva `[]`) ademas de `revalidate`; sin eso sale `ƒ` en el build.
Toda mutacion de catalogo llama a `revalidateCatalog()` (server) o `requestCatalogRevalidation()` (cliente).
En paginas ISR, si la carga falla hay que **lanzar** el error: devolver una pagina de error la cachea 1 h.
Datos compartidos entre `generateMetadata` y la pagina: envolver la query en `cache()` de React.

**Nada de cookies en paginas publicas.** Leer la sesion (getUser/cookies) vuelve dinamica la pagina; la
redireccion del usuario logueado en la home vive en `src/middleware.ts`.

**Sesion en servidor.** `getSessionUser(supabase)` (`src/lib/supabase/server.ts`) usa `getClaims()`: los JWT
son ES256, asi que verifica en local sin ida y vuelta a Auth. Las consultas de rol/perfil van en el mismo
`Promise.all` que los datos (RLS ya limita a filas propias).

**Perfil en cliente (UserContext).** Un fetch de `get_my_profile` por carga. supabase-js emite `SIGNED_IN`
mientras restaura la sesion, antes de que resuelva `getSession()`: el listener lo ignora hasta que acaba la
carga inicial (`initializingRef`). Si vuelve a salir doble, mirar ahi.

**Traducciones.** Solo viajan al navegador `SHELL_NAMESPACES` + los de la ruta (`src/i18n/clientMessages.ts`,
un `layout.tsx` por ruta con `scopedMessagesLayout`). `IntlScope` fusiona con los del padre porque los
providers de next-intl 3 no heredan mensajes. Verificar con `npm run check:i18n-scopes`.

**Storage.** Ruta nueva por subida (cache 1 ano) + `removeUnusedUpload()` tras guardar; borrar un curso
borra `course_covers/<id>/`.

**Medir.** El TTFB engana (las paginas hacen streaming): medir hasta el ultimo byte. Playwright con
`networkidle` puede colgarse por los prefetch de `<Link>`: usar `load` + espera fija.
