# OpenWA: gotchas que mas cuestan

Extraido de `docs/OPENWA_INTEGRATION_GUIDE.md` §7. Todos ya resueltos en `src/lib/whatsapp/` — mantenerlos al tocar ese codigo.

| # | Sintoma | Causa | Fix |
|---|---|---|---|
| 1 | "Session X is not active" con sesion conectada | Se uso el `name` de la sesion en vez del `id` | Usar siempre el UUID |
| 2 | Envio marcado como fallido pero llega | Respuesta real `{messageId, timestamp}`, no `{success, data}` | Wrapper tolerante a ambos formatos |
| 3 | Respuestas que no matchean ningun envio | `data.from` llega como `@lid`, no `@c.us` | Matchear por `wa_messages.message_id` |
| 4 | Solo se procesa el primer mensaje | `idempotencyKey` constante (`"msg_unknown"`) | Clave propia con `data.id` / `deliveryId` |
| 5 | Responde a "mensajes vacios" | Eventos `e2e_notification` y otros no-chat | Filtrar `type === "chat"` y body no vacio |
| 6 | Numero inexistente (`1535...`) | Doble codigo de pais | `phoneToChatId` respetando el `+` |
| 7 | Backend en la nube no alcanza OpenWA local | localhost no es publico | ngrok / Cloudflare Tunnel |
| 8 | Mensajes duplicados | Dos disparadores para lo mismo | Un unico source of truth (`insertNotification`) |
| 9 | `extensions.http_post does not exist` | pg_net vive en schema `net` | `net.http_post` |
| 10 | Trigger DB falla en silencio | `EXCEPTION WHEN OTHERS` traga el error | Loguear `SQLERRM` |

La firma HMAC SHA-256 se valida contra el body CRUDO, con comparacion timing-safe.
