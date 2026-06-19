# WhatsApp Business API — Integration Spec

## 1. Current State

Actualmente los mensajes se envían mediante links `wa.me` que abren WhatsApp en el dispositivo del usuario con un mensaje pre-armado. El mensaje se envía desde el WhatsApp **personal** de quien hace clic.

### Archivos involucrados actualmente:
- `src/components/CitasTable.tsx` — `waMsgUrl()` genera link para citas
- `src/components/TurnosTable.tsx` — `waMsgUrl()` genera link para turnos

### Problema:
No hay trazabilidad, no se puede usar una cuenta business, depende del WhatsApp personal del operador.

---

## 2. Requisitos

### Funcionales:
1. Enviar mensajes WhatsApp desde la cuenta Business de Bendito Tattoo
2. Los mensajes se envían automáticamente al:
   - **Concretar una cita** → mensaje de confirmación al cliente
   - **Crear un turno manual** → mensaje de confirmación al cliente
   - Botón "Mensaje" en tabla → abre el mensaje pre-armado (como ahora, pero via API)
3. Soporte para mensajes bilingües (español/inglés) — igual que ahora
4. Historial de mensajes enviados (opcional, v2)

### Técnicos:
1. Usar **WhatsApp Cloud API** (Meta, gratuita)
2. Almacenar tokens de forma segura (server-side only)
3. No bloquear la UI — los envíos son asíncronos
4. Fallback: si la API falla, mostrar error y permitir reenvío manual

---

## 3. Arquitectura

```
UI (client) → Server Action → WhatsApp Cloud API → Cliente
                  ↓
              Guardar log en Supabase (opcional)
```

### Flujo:
1. Usuario hace clic en "Mensaje" o se concreta una cita
2. Client component llama a server action `sendWhatsAppMessage()`
3. Server action:
   a. Obtiene `access_token` de la variable de entorno (NUNCA del cliente)
   b. Hace POST a `https://graph.facebook.com/v22.0/{phone-number-id}/messages`
   c. Retorna `{ success: true }` o `{ error: "..." }`
4. Client muestra notificación de éxito/error

---

## 4. Componentes a modificar/crear

### Nuevos archivos:

| Archivo | Tipo | Propósito |
|---------|------|-----------|
| `src/lib/whatsapp-actions.ts` | Server action | Enviar mensajes via WhatsApp Cloud API |
| `src/components/WhatsAppButton.tsx` | Client component | Botón reutilizable con estado de envío |

### Archivos a modificar:

| Archivo | Cambio |
|---------|--------|
| `src/components/CitasTable.tsx` | Reemplazar `waMsgUrl()` + `<a>` por `WhatsAppButton` |
| `src/components/TurnosTable.tsx` | Reemplazar `waMsgUrl()` + `<a>` por `WhatsAppButton` |
| `src/lib/appointments-actions.ts` | Agregar envío automático al concretar cita |
| `src/lib/turnos-actions.ts` | Agregar envío automático al crear turno |
| `.env.example` | Agregar variables de WhatsApp |

---

## 5. API — WhatsApp Cloud API

### Endpoint:
```
POST https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages
```

### Headers:
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

### Body (template message):
```json
{
  "messaging_product": "whatsapp",
  "to": "5215551234567",
  "type": "template",
  "template": {
    "name": "appointment_confirmation",
    "language": { "code": "es_MX" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "cliente_nombre" },
          { "type": "text", "text": "fecha_hora" },
          { "type": "text", "text": "monto" }
        ]
      }
    ]
  }
}
```

### Body (session message — para botón "Mensaje"):
```json
{
  "messaging_product": "whatsapp",
  "to": "5215551234567",
  "type": "text",
  "text": { "body": "¡Hola! Te confirmamos tu turno..." }
}
```

> **Nota**: Los mensajes de sesión (text libre) solo funcionan si el cliente ha enviado un mensaje al business en las últimas 24hs. Para clientes nuevos, se requiere usar **templates** aprobados por Meta.

---

## 6. Environment Variables

```env
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAAT...
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
WHATSAPP_API_VERSION=v22.0
```

---

## 7. Base de Datos (opcional v2)

Para tracking de mensajes enviados:

```sql
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT REFERENCES appointments(id),
  turno_id BIGINT REFERENCES turnos(id),
  to_phone TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'template' | 'text'
  status TEXT NOT NULL, -- 'sent' | 'failed'
  wa_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. Server Action — `src/lib/whatsapp-actions.ts`

```typescript
"use server";

type SendMessageParams = {
  to: string;           // Teléfono del cliente (solo dígitos)
  template?: string;    // Nombre del template (para clientes nuevos)
  parameters?: string[]; // Parámetros del template
  text?: string;        // Texto libre (si aplica)
};

type SendMessageResult = {
  success: boolean;
  error?: string;
  waMessageId?: string;
};

export async function sendWhatsAppMessage(
  params: SendMessageParams
): Promise<SendMessageResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0";

  // Validar que las variables de entorno existan
  if (!token || !phoneNumberId) {
    return { success: false, error: "WhatsApp no configurado" };
  }

  // Construir payload según tipo
  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to: params.to.replace(/[^0-9]/g, ""),
  };

  if (params.template) {
    payload.type = "template";
    payload.template = {
      name: params.template,
      language: { code: "es_MX" },
      components: params.parameters ? [
        {
          type: "body",
          parameters: params.parameters.map((p) => ({ type: "text", text: p })),
        },
      ] : undefined,
    };
  } else if (params.text) {
    payload.type = "text";
    payload.text = { body: params.text, preview_url: true };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("WhatsApp API error:", data);
      return {
        success: false,
        error: data.error?.message || "Error al enviar mensaje",
      };
    }

    return {
      success: true,
      waMessageId: data.messages?.[0]?.id,
    };
  } catch (err) {
    console.error("WhatsApp network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error de red",
    };
  }
}
```

---

## 9. UI — `WhatsAppButton` Component

```typescript
// Props:
type Props = {
  phone: string;
  message: string;
  template?: string;
  templateParams?: string[];
  variant?: string;
  disabled?: boolean;
};

// Behavior:
// 1. Muestra botón "Mensaje"
// 2. Al hacer clic: llama a sendWhatsAppMessage()
// 3. Muestra spinner/loading mientras envía
// 4. Success: notificación verde "Mensaje enviado"
// 5. Error: notificación roja con el error + botón para reintentar
// 6. Fallback: si la API no está configurada, abre wa.me como antes
```

---

## 10. Integración con Server Actions existentes

### Al concretar una cita (`appointments-actions.ts` → `completeAppointment()`):
```typescript
export async function completeAppointment(id: number) {
  const result = await /* ... lógica actual ... */;

  // Envío automático (no bloqueante)
  if (result.success) {
    // No await — fire-and-forget
    sendWhatsAppMessage({
      to: appointment.telefono,
      template: "appointment_confirmation",
      parameters: [appointment.name, dateStr, amountStr],
    });
  }

  return result;
}
```

### Al crear turno manual (`turnos-actions.ts` → `createTurno()`):
```typescript
// Misma lógica: después de crear el turno, enviar mensaje
```

---

## 11. Consideraciones de Seguridad

1. `WHATSAPP_ACCESS_TOKEN` es secreto — SOLO en variables de entorno del servidor
2. El token nunca se envía al cliente
3. Las server actions se ejecutan en el servidor (no exponen el token)
4. Rate limiting: WhatsApp Cloud API tiene límites (250 msg/día para números verificados, escala según calidad)
5. Validar números de teléfono antes de enviar

---

## 12. Setup Externo (Meta Business)

Pasos que el usuario debe hacer en Meta:

1. Ir a https://business.facebook.com/ — crear cuenta business
2. Ir a https://business.facebook.com/wa/ — conectar WhatsApp
3. Verificar número de teléfono business
4. Ir a https://developers.facebook.com/ — crear app
5. Agregar producto "WhatsApp"
6. Copiar `Phone Number ID` y `Access Token` (permanente)
7. (Opcional) Crear templates de mensaje en el panel de WhatsApp

---

## 13. Plan de Implementación

| Fase | Tareas | Dependencias |
|------|--------|-------------|
| **Fase 1: Setup** | Setup Meta Business, obtener token, configurar env vars | Usuario |
| **Fase 2: Core** | `whatsapp-actions.ts`, `WhatsAppButton.tsx` | Fase 1 |
| **Fase 3: Integración** | Reemplazar wa.me links en CitasTable y TurnosTable | Fase 2 |
| **Fase 4: Automático** | Agregar envío al concretar cita y crear turno | Fase 2 |
| **Fase 5: Testing** | Probar con número real, manejar errores | Fase 3-4 |
| **Fase 6: Logs (v2)** | Tabla `whatsapp_logs`, historial de mensajes | — |
