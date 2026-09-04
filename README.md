# 🏠 HogarApp

PWA para administrar un hogar **entre dos personas**: tareas por día con recurrencia y puntos, gastos fijos y variables, lista de compras en tiempo real con provisiones (heladera, despensa, limpieza), calendario del hogar, espacio "Nosotros" (planes, cine, viajes y premios canjeables) y contactos útiles. Pensada para instalarse desde Safari en dos iPhones ("Agregar a inicio") y sincronizarse al instante entre ambos.

## Pantallas

| Pestaña | Qué hace |
|---|---|
| **Inicio** | Resumen de hoy: tareas del día (se completan desde ahí), agenda con eventos y pagos que vencen, gastos del mes, puntos de ambos y tareas atrasadas. La ruedita lleva a Configuración. |
| **Tareas** | Organizadas por día (tira semanal). Tareas recurrentes ("cambiar sábanas cada 2 semanas") que aparecen solas, puntos libres por tarea y plantillas autoaprendidas con sus puntos. Los pagos fijos del día aparecen para registrarlos. |
| **Compras** | Lista colaborativa con autocompletado. Lo que tildás pasa solo a **Provisiones** (Heladera / Despensa / Limpieza); marcar "Comprar" lo devuelve a la lista. |
| **Gastos** | Total del mes con proporción fijos/variables. **Gastos fijos programados** (alquiler, expensas, servicios…) con vencimiento mensual, recordatorio en el calendario y registro del pago en un toque. |
| **Calendario** | Grilla del mes; al tocar un día se ven sus eventos, tareas y pagos. Debajo, los próximos 14 días. |
| **Nosotros** | Planes, Cine, Viajes y Premios (canje de puntos entre los dos). |
| **Configuración** | Contactos del hogar (plomero, electricista…) y Ajustes (hogar, código de invitación, cuenta). |

## Diseño

Identidad "Marino y plata": azul marino de marca, fondo plata, celeste de acento; tipografías Hanken Grotesk (títulos) y Figtree (texto), íconos SVG propios, modo oscuro automático. El proyecto trae instalada la skill [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) en `.claude/skills/` para seguir iterando el diseño con Claude Code.

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

### 3b. (Opcional) Deploy automático desde GitHub

`.github/workflows/deploy.yml` publica sola cada vez que algo llega a `main`, sin
necesidad de ninguna computadora. Requiere cargar en **Settings → Secrets and
variables → Actions** del repo:

| Secret | De dónde sale |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | JSON de una cuenta de servicio de Google Cloud con los roles **Firebase Hosting Admin**, **Firebase Rules Admin** y **Service Usage Consumer** |
| `VITE_FB_API_KEY`, `VITE_FB_AUTH_DOMAIN`, `VITE_FB_PROJECT_ID`, `VITE_FB_APP_ID`, `VITE_FB_SENDER_ID` | los mismos valores del `.env.local` |

Publica `hosting` **y** `firestore:rules`: si solo se subiera el hosting, las
funciones nuevas quedarían bloqueadas por reglas viejas.

### 4. Instalar en los iPhones

1. Abrí la URL en **Safari** → iniciá sesión con Google.
2. Compartir → **Agregar a pantalla de inicio**.
3. La primera persona crea el hogar; la segunda entra con el **código de invitación** (se comparte desde Ajustes) **en vez de crear el suyo**.

> Si cada uno creó su propio hogar, no hace falta empezar de cero: quien quiera mudarse entra en **Ajustes → Salir del hogar** (si estaba solo, su hogar se borra) y después usa el código del otro.

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

- Cada uno lee y escribe **solo su propio** doc de usuario; la colección `users` no se puede listar (el nombre y la foto de la pareja salen de `memberProfiles` del hogar).
- Solo los **miembros del hogar** leen/escriben sus datos; máximo **2 miembros**.
- Unirse requiere el **código de invitación** (solo lectura puntual por código exacto, nunca listado).
- Los **puntos** solo pueden moverse sobre el balance propio, con delta acotado y sin quedar negativos; el historial de canjes es inmutable.
- Al **salir del hogar** cada uno solo puede sacarse a sí mismo (nunca a su pareja) y el hogar se borra únicamente si quedaba una sola persona.

> Limitación conocida (plan gratuito, sin Cloud Functions): las reglas acotan el delta de puntos pero no pueden verificar transaccionalmente que coincida con los puntos de la tarea completada. Entre dos personas de confianza, el historial es la trazabilidad.

## Modo demo

`npm run build:demo` genera `dist-demo/demo.html`: la app completa en un solo archivo, sin Firebase (datos de ejemplo guardados en el navegador). Sirve para probarla o mostrarla sin configurar nada.

## Recordatorios

Los vencimientos, turnos y pagos fijos se muestran **dentro de la app** (Inicio, "Próximos" en Calendario y badge en la pestaña). El modelo de datos ya queda preparado para sumar notificaciones push reales (Firebase Cloud Messaging + Cloud Functions, requiere plan Blaze) sin cambiar el esquema.
