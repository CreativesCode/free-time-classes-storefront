# Assets móviles (Capacitor)

Los **iconos y splash de iOS/Android** se generan desde **`public/images/Isotipo.svg`** (copia temporal `assets/logo.svg`, ignorada en git).

```bash
npm run assets:mobile
```

Colores usados: fondo de icono `#485569` / `#27272a` (oscuro), splash `#fef3ff` / `#18181b` — alineados con el isotipo y el tema de la app.

**PWA:** los `.webp` en `public/icons/` salieron del mismo isotipo. El script solo regenera nativo (`--android --ios`). Si cambias el SVG y quieres actualizar también los iconos web, ejecuta una vez:

`npx @capacitor/assets generate --pwa --iconBackgroundColor "#485569" --splashBackgroundColor "#fef3ff"`

y mueve los archivos nuevos de la carpeta `icons/` del raíz a `public/icons/`, o ajusta rutas en `manifest.webmanifest`.
