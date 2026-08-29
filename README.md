# 🏠 HogarApp

PWA para administrar un hogar **entre dos personas**: tareas, gastos compartidos, lista de compras en tiempo real, calendario con vencimientos, inventario de heladera/despensa, modo pareja, puntos canjeables y rincón de mantenimiento. Pensada para instalarse desde Safari en dos iPhones ("Agregar a inicio") y sincronizarse al instante entre ambos.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS v4 · modo oscuro automático · UI estilo iOS con safe-areas
- **PWA**: `vite-plugin-pwa` (service worker con precache del shell, manifest es-AR, instalable offline)
- **Backend**: Firebase plan Spark (gratis) — Firestore en tiempo real + Auth con Google. Sin servidores propios.
- **Datos offline**: persistencia local de Firestore; la app abre y funciona sin conexión y sincroniza al volver.

## Configuración inicial (una sola vez)

### 1. Crear el proyecto Firebase

1. Entrá a [console.firebase.google.com](https://console.firebase.google.com) → **Agregar proyecto** (ej: `hogarapp`). Analytics: no hace falta.
2. **Build → Authentication → Get started → Sign-in method → Google → Habilitar** (elegí tu email de soporte).
3. **Build → Firestore Database → Crear base de datos → modo producción**, región **`southamerica-east1` (São Paulo)** — la más cercana a Argentina; la región no se puede cambiar después.
4. **Configuración del proyecto (⚙️) → General → Tus apps → Agregar app web** (`</>`, nombre "HogarApp", sin marcar hosting). Copiá los valores de `firebaseConfig`.

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local` con los valores del paso anterior. **Importante**: en `VITE_FB_AUTH_DOMAIN` poné `<project-id>.web.app` (el dominio donde va a vivir la app) — es lo que hace que el login con Google funcione bien en la PWA instalada en iPhone.

### 3. Deploy de reglas y hosting

```bash
npm install -g firebase-tools
firebase login
firebase use <project-id>          # escribe .firebaserc
npm run build
firebase deploy                    # sube reglas de Firestore + hosting
```

La app queda en `https://<project-id>.web.app`.

### 4. Instalar en los iPhones

1. Abrí la URL en **Safari** → iniciá sesión con Google.
2. Compartir → **Agregar a pantalla de inicio**.
3. La primera persona crea el hogar; la segunda entra con el **código de invitación** (se comparte desde Ajustes).

## Desarrollo local

```bash
npm install
npm run dev            # contra el proyecto Firebase real

# O con emuladores (no necesita proyecto real; requiere Java):
firebase emulators:start --only auth,firestore
VITE_USE_EMULATORS=1 npm run dev
```

Otros comandos: `npm run build` (typecheck + build), `npm test` (vitest), `npm run typecheck`.

## Cómo está protegido

Las reglas de Firestore (`firestore.rules`) garantizan que:

- Solo los **miembros del hogar** leen/escriben sus datos; máximo **2 miembros**.
- Unirse requiere el **código de invitación** (solo lectura puntual por código exacto, nunca listado).
- Los **puntos** solo pueden moverse sobre el balance propio, con delta acotado y sin quedar negativos; el historial de canjes es inmutable.

> Limitación conocida (plan gratuito, sin Cloud Functions): las reglas acotan el delta de puntos pero no pueden verificar transaccionalmente que coincida con los puntos de la tarea completada. Entre dos personas de confianza, el historial es la trazabilidad.

## Recordatorios

Los vencimientos y turnos se muestran **dentro de la app** (sección "Próximos" y badge en Calendario). El modelo de datos ya queda preparado para sumar notificaciones push reales (Firebase Cloud Messaging + Cloud Functions, requiere plan Blaze) sin cambiar el esquema.
