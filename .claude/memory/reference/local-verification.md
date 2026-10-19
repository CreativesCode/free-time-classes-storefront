# Verificar cambios en local sin tocar el dev server ni exponer credenciales

**Middleware:** vive en `src/middleware.ts` (con la app en `src/`, Next ignora un `middleware.ts` en la raiz;
estuvo asi hasta FRE0009/F009 y no corria nada: ni rutas protegidas, ni deteccion de idioma). Turbopack no
recoge un middleware que cambia de sitio hasta reiniciar `npm run dev`.

**Servidor de verificacion paralelo** (cuando el usuario tiene su `next dev` en :3000 y no hay que reiniciarlo):
`git -c core.longpaths=true worktree add --detach <scratchpad>/wt HEAD`, copiar `.env.local` y los archivos
sin commitear, junction de `node_modules` (`New-Item -ItemType Junction`) y `next dev -p 3001` **sin --turbo**
(Turbopack no sigue el junction: "Next.js package not found"). Al acabar: borrar el junction con `rmdir` y
`git worktree remove --force`.

**Sesion de las cuentas de prueba sin navegador:** password grant contra `/auth/v1/token` con la publishable key
y construir la cookie de `@supabase/ssr` (`sb-<ref>-auth-token=base64-<json de la sesion>`, troceada a ~3180
chars en `.0`, `.1`...). Las credenciales se leen en el script desde la tarea de Tasknic y nunca se imprimen.

**E2E con navegador real:** `playwright-core` de la cache de npx (`~/AppData/Local/npm-cache/_npx/*/node_modules/playwright-core`)
con `executablePath` a un `chromium_headless_shell-*` ya instalado en `~/AppData/Local/ms-playwright`.

**Lecturas de BD:** PostgREST con la service role solo para lecturas (`limit=0` para comprobar columnas). DDL y
catalogo (`pg_get_constraintdef`, policies, grants) necesitan la Management API: el `SUPABASE_ACCESS_TOKEN`
que inyecta el entorno de esta maquina es de OTRA cuenta (otros proyectos) y da 403 en `nqetxsifeulhfkwjdsbp`;
para este proyecto se usa `SUPABASE_FTC_ACCESS_TOKEN` en `.env.local` (no tocar el otro token).
