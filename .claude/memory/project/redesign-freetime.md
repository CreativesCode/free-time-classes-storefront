# Rediseno FreeTime: estado y deuda pendiente

Roadmap completo en `docs/design/REDESIGN.md`; prototipo en `docs/design/*.jsx` + `index.html`.

**Estado (verificado contra el codigo a 2026-10-19):** fases 0–8 completadas. La chrome legacy se elimino el
2026-05-06 (`NavbarWrapper`, `Footer`, `FooterWrapper`, `src/lib/redesign/freetime-routes.ts` ya no existen):
`LocaleLayoutWrapper` envuelve SIEMPRE con `FreetimeShell`. El doc todavia describe el registry de rutas — esta obsoleto en ese punto.

**Lenguaje visual:** paleta paper + oro (`bg-ft-paper`, `text-ft-ink`, `ft-accent` #C9A86A...), Geist para UI,
Instrument Serif italic para titulares editoriales, cards con borde 1px y sombra suave, hero cards oscuros con halo dorado.
Atomos en `src/components/ds/` (Avatar, Stars, Pill, TopBar, BottomNav, SectionTitle, BookingPicker, StudentSidebarNav...).
En desktop: sidebar `StudentSidebarNav` de 220px (`lg:grid-cols-[220px_1fr]`), con items distintos si `isTutor`.

**Deuda pendiente (limpieza, PR aparte):**
1. `tailwind.config.js` sigue con `fontFamily.sans` = Plus Jakarta → pasar a Geist.
2. Tokens morados legacy (`--primary`, `--lt-*`) usados por primitives shadcn → restilar o reapuntar.
3. Tokens `--ft-*` viven bajo `[data-theme="freetime"]` (load-bearing) → moverlos a `:root`.
4. Subcomponentes del perfil de profesor (`TutorCVSection`, `TutorSubjectsManager`, `AvailabilityCalendar`,
   `RecurringAvailabilityManager`, `TutorBookingRequests`...) y el interior de `TutorDashboardClient` siguen con estilo violet legacy.

**Decisiones de producto abiertas:** dark mode (solo superficies inmersivas o completo), pantalla "Lesson live"
(`/[locale]/lesson/[id]`, no construida), modo audio "manos libres" (hoy decorativo), categorias de home/dashboard
hardcoded, badge de no leidos en `StudentSidebarNav` sin cablear, selector Audio/Video (no existe en el modelo).
