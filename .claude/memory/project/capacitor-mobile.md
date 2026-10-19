# App movil con Capacitor: modo servidor remoto

Fuente: `docs/proyecto-maestro.md` §2 y `docs/auditoria-capacitor.md` (2026-03-20).

**Decision:** la app nativa NO es un export estatico. La arquitectura usa middleware con cookies, SSR y route
handlers, incompatibles con `output: 'export'`. `capacitor.config.ts` carga la web desde un servidor Next.js
(`server.url` = env `CAPACITOR_SERVER_URL`, leida con `@next/env`). `webDir: capacitor-www` es solo un HTML minimo
para que `cap sync` funcione.
- Android emulador en dev: `CAPACITOR_SERVER_URL=http://10.0.2.2:3000` + `CAPACITOR_ANDROID_CLEARTEXT=true`.
- iOS simulador: `http://localhost:3000`. Produccion: dominio publico.

**Reglas que se derivan:** API en `src/app/api/` sin locale (ya migrado desde `[locale]/api`), secretos solo en
route handlers, nunca `output: 'standalone'`/`'export'`, assets en `/public`, links externos (Meet) con
`@capacitor/browser`. `npm run build:mobile` regenera iconos/splash desde `public/images/Isotipo.svg`.

**Plugins:** solo `@capacitor/browser` instalado. Pendientes segun feature: `push-notifications` (+ FCM),
`camera`, `app-launcher`, `network` (siempre `npx cap sync` tras instalar).
Push movil = Capacitor + FCM, no la PWA del skill `add-mobile` de Titan Factory.
