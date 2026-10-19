# Radios en el design system FreeTime: solo rounded-ft-*

En todo lo que renderiza dentro de `FreetimeShell` / `data-theme="freetime"` (hoy: toda la app) usar solo
`rounded-ft-*`, `rounded-full` o valores arbitrarios (`rounded-[12px]`). NUNCA `rounded-md/lg/xl/2xl/3xl`.

**Por que:** `tailwind.config.js` redefine la escala legacy del tema morado con valores enormes:
`rounded-md` = 24px, `rounded-lg` = 32px, `rounded-xl` = 48px, `rounded-2xl` = 64px. Un `rounded-2xl` en una card
FreeTime da 64px y el texto posicionado con `bottom-3 left-3` queda dentro de la curva y se recorta (bug real:
"English on the move" se veia como "nglish on the move" en las cards de tutor).

**Como aplicar** (radio del prototipo → token):
- 8px → `rounded-ft-xs` (chips pequenos)
- 10px → `rounded-ft-sm`
- 12px → `rounded-ft` (inputs, botones secundarios)
- 14px → `rounded-ft-md` (botones primarios, search bar)
- 16px → `rounded-ft-base` (cards de contenido)
- 18px → `rounded-ft-lg` (list cards)
- 20px → `rounded-ft-xl` (signature cards)
- 24px → `rounded-ft-2xl` (hero / featured / editorial)

Texto absoluto sobre imagen redondeada: al menos `inset-x-4` (16px) de padding lateral.

No tocar las entradas legacy de `tailwind.config.js`: componentes antiguos todavia dependen de ellas.
Se eliminaran en la limpieza post-rediseno (ver `project/redesign-freetime.md`).
