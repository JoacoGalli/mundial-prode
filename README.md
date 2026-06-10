# Mundial Prode 🏆⚽

Mundial Prode es un juego de pronósticos (prode) para el Mundial 2026, 100% frontend:
**React + Vite + TypeScript**, autenticación con **Firebase Auth (Google Sign-In)** y base
de datos en tiempo real con **Firebase Firestore**. Se hostea gratis en **GitHub Pages**.

🔗 Demo: https://joacogalli.github.io/mundial-prode/

---

## Índice

1. [Features](#features)
2. [Configurar Firebase](#configurar-firebase)
3. [Variables de entorno](#variables-de-entorno)
4. [Desarrollo local](#desarrollo-local)
5. [Deploy a GitHub Pages](#deploy-a-github-pages)
6. [Cómo convertirte en admin](#cómo-convertirte-en-admin)
7. [Sistema de puntaje](#sistema-de-puntaje)
8. [Distribución de premios](#distribución-de-premios)

---

## Features

- **Login con Google** vía Firebase Auth, sesión persistente.
- **Perfil automático**: al loguearte por primera vez se crea tu documento en
  `/users/{uid}` con nombre, email, foto y `totalPoints: 0`.
- **Roles**: el primer usuario que se loguea queda como admin automáticamente
  (se agrega a `config/settings.adminUIDs`). Cualquier otro UID que agregues a
  esa lista también será admin.
- **Tabla de posiciones (Dashboard)**: ranking en tiempo real con medallas
  🥇🥈🥉 para el top 3, y premio estimado si hay un pozo configurado.
- **Partidos**: lista de partidos del Mundial con pronóstico editable
  (spinners de goles para cada equipo). Se bloquea automáticamente cuando
  llega la fecha/hora del partido. Un desplegable permite navegar por fase:
  Fecha 1, Fecha 2, Fecha 3, Dieciseisavos, Octavos, Cuartos, Semifinales y
  Final.
- **Mis Pronósticos**: historial de todos tus pronósticos con el resultado
  oficial y los puntos obtenidos en cada partido.
- **Premios**: muestra el pozo total, la distribución configurada y el pago
  estimado por posición según la tabla actual.
- **Resultados automáticos**: los partidos se cargan con su ID de evento de
  [TheSportsDB](https://www.thesportsdb.com/). Cada vez que un admin abre la
  app, se consulta TheSportsDB para los partidos ya jugados sin resultado
  cargado y, si ya finalizaron, se aplica el resultado solo — esto dispara el
  recálculo automático de puntos de todos los pronósticos. No hace falta
  cargar resultados a mano.
- **Panel de Admin** (`/admin`):
  - Cargar el fixture real del Mundial 2026 (Fecha 1 de la fase de grupos)
    con un botón.
  - "Actualizar fixture desde API": consulta TheSportsDB y agrega los
    partidos nuevos que se vayan publicando (Fecha 2, Fecha 3, llaves de
    eliminación directa) sin tocar los partidos ni pronósticos existentes.
  - Cargar/editar manualmente el resultado oficial de cada partido si hace
    falta (esto también recalcula los puntos de todos los pronósticos para
    ese partido y el total de cada jugador).
  - Bloquear/desbloquear partidos manualmente.
  - Configurar el pozo de premios (monto + moneda ARS/USD) y la distribución
    por puestos, con presets o porcentajes personalizados (deben sumar 100%).
  - Botón "Calcular Ganadores" para ver el ranking final con el premio de
    cada jugador.
- **Diseño**: tema oscuro mobile-first, tipografía Bebas Neue (títulos) +
  Inter (texto), paleta navy/gold/verde, tarjetas de partido estilo "ticket
  de cancha" con borde punteado.

---

## Configurar Firebase

1. Andá a la [consola de Firebase](https://console.firebase.google.com/) y
   creá un nuevo proyecto (plan gratuito **Spark** es suficiente).
2. **Habilitar Google Sign-In**:
   - En el menú lateral andá a **Build > Authentication > Sign-in method**.
   - Habilitá el proveedor **Google** y guardá.
3. **Crear Firestore**:
   - Andá a **Build > Firestore Database > Create database**.
   - Elegí **Start in test mode** (las reglas de seguridad ya vienen
     definidas en `firestore.rules` de este repo; podés desplegarlas después
     con `firebase deploy --only firestore:rules` si usás Firebase CLI, o
     pegarlas manualmente en la pestaña **Rules** de la consola).
4. **Obtener la configuración del SDK**:
   - Andá a **Project settings** (ícono de engranaje) > **General**.
   - En "Your apps" agregá una app **Web** (ícono `</>`).
   - Copiá los valores de `firebaseConfig` (apiKey, authDomain, projectId,
     storageBucket, messagingSenderId, appId).

---

## Variables de entorno

Creá un archivo `.env.local` en la raíz del proyecto (este archivo **no se
sube a git**) con el siguiente formato exacto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

> ⚠️ Si vas a deployar a GitHub Pages, también necesitás cargar estas mismas
> variables como **GitHub Actions secrets** o reemplazarlas antes del build,
> ya que `.env.local` no se commitea. Una opción simple es crear un
> `.env.production` local (tampoco commiteado) con los mismos valores antes
> de correr `npm run deploy`.

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abrí http://localhost:5173 en el navegador.

---

## Deploy a GitHub Pages

El proyecto ya está configurado con `vite.config.ts` (`base: '/mundial-prode/'`)
y los scripts `predeploy`/`deploy` usando [`gh-pages`](https://www.npmjs.com/package/gh-pages).

```bash
npm run deploy
```

Esto corre `npm run build` y publica la carpeta `dist/` en la rama `gh-pages`
del repo. La app queda disponible en:

```
https://<tu-usuario-de-github>.github.io/mundial-prode/
```

> Recordá habilitar **GitHub Pages** en el repo (Settings > Pages > Source:
> rama `gh-pages`) la primera vez.

---

## Cómo convertirte en admin

El **primer usuario** que inicia sesión con Google queda automáticamente como
admin (su UID se guarda en `config/settings.adminUIDs`).

Si querés agregar a otra persona como admin (o asignarte el rol manualmente):

1. Andá a la consola de Firebase > **Firestore Database**.
2. Abrí la colección `config` y el documento `settings`.
3. Editá el campo `adminUIDs` (array) y agregá el **UID** del usuario.
   - Podés ver el UID de un usuario en **Authentication > Users**.
4. Guardá los cambios. La próxima vez que ese usuario recargue la app, va a
   ver la pestaña **Admin** en la barra de navegación inferior.

---

## Sistema de puntaje

Cada pronóstico se compara contra el resultado oficial cargado por el admin:

| Condición | Puntos | Descripción |
|---|---|---|
| Acertaste el resultado exacto (ej: pronosticaste 2-1 y el resultado fue 2-1) | **12** | Resultado Exacto (9 + 3 de bono) |
| Acertaste el ganador/empate **y** los goles de uno de los dos equipos | **7** | Resultado General |
| Acertaste el ganador/empate, pero ningún marcador exacto | **5** | Resultado Parcial |
| No acertaste el ganador, pero sí los goles de uno de los dos equipos | **2** | Goles de un Equipo |
| Ninguna de las anteriores | **0** | Sin puntos |

La función exacta usada es:

```typescript
function calculatePoints(
  pred: { home: number; away: number },
  result: { home: number; away: number }
): number {
  const exactScore = pred.home === result.home && pred.away === result.away;
  const predWinner = Math.sign(pred.home - pred.away);
  const realWinner = Math.sign(result.home - result.away);
  const correctWinner = predWinner === realWinner;
  const correctHome = pred.home === result.home;
  const correctAway = pred.away === result.away;
  const oneTeamCorrect = correctHome !== correctAway;

  if (exactScore) return 12;
  if (correctWinner && (correctHome || correctAway)) return 7;
  if (correctWinner) return 5;
  if (oneTeamCorrect) return 2;
  return 0;
}
```

Cuando el admin carga el resultado oficial de un partido, la app recalcula
automáticamente los puntos de **todos** los pronósticos de ese partido y
actualiza el `totalPoints` de cada jugador.

---

## Distribución de premios

Desde el panel de Admin se configura:

- **Pozo total**: monto y moneda (`ARS` o `USD`).
- **Distribución por puesto**: porcentaje del pozo que recibe cada posición
  del ranking final. Tiene presets rápidos:
  - 🥇🥈 **70% / 30%** — 2 puestos
  - 🥇🥈🥉 **50% / 30% / 20%** — 3 puestos
  - 🥇🥈🥉 **60% / 25% / 15%** — 3 puestos
  - **Personalizada**: ingresás tantos porcentajes como puestos quieras,
    siempre que **sumen 100%**.

El monto que recibe cada jugador se calcula como:

```
premio_puesto_N = pozo_total * (porcentaje_puesto_N / 100)
```

El botón **"Calcular Ganadores"** del panel de admin ordena a todos los
jugadores por `totalPoints` (descendente) y muestra el premio correspondiente
a cada uno según su posición y la distribución configurada.

---

## Sincronización automática de resultados

Cada partido seedeado (`src/data/matches.ts`) incluye un `externalId`: el
`idEvent` del partido en [TheSportsDB](https://www.thesportsdb.com/) (liga
**FIFA World Cup**, id `4429`, temporada `2026`), usando su API pública
gratuita (key `3`, sin necesidad de registro).

Funcionamiento (`src/hooks/useAutoSyncResults.ts`):

1. Cada vez que un **admin** abre la app, el hook revisa todos los partidos.
2. Para los que ya arrancaron (`locked` o `datetime` pasada) y todavía no
   tienen `result` cargado, consulta
   `GET https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id={externalId}`.
3. Si TheSportsDB ya tiene `intHomeScore`/`intAwayScore` (partido finalizado),
   se llama a `setMatchResult(matchId, result)` automáticamente — esto marca
   el partido como `locked` y recalcula los puntos de todos los pronósticos
   y el `totalPoints` de cada jugador.
4. Cada partido se chequea una sola vez por sesión (no se vuelve a consultar
   si ya tiene resultado).

> ⚠️ Esto requiere que un admin tenga la app abierta en algún momento después
> de que termine un partido para que se dispare la sincronización (no hay
> backend/cron). Si necesitás forzarlo, basta con recargar la página estando
> logueado como admin. Si querés cargar un resultado a mano (por ejemplo si
> TheSportsDB todavía no lo actualizó), podés seguir haciéndolo desde la
> tabla de partidos del panel de Admin.

### Cargar fechas y fases siguientes

Al día de hoy TheSportsDB sólo publica la Fecha 1 de la fase de grupos. A
medida que se confirmen la Fecha 2, la Fecha 3 y las llaves de eliminación
directa (Dieciseisavos, Octavos, Cuartos, Semifinales, Final), el admin puede
ir al panel de Admin y tocar **"Actualizar fixture desde API"**: la app
vuelve a consultar `eventsseason.php` y agrega como partidos nuevos sólo los
que todavía no estén en Firestore (comparando por `externalId`), sin afectar
los partidos ni pronósticos ya cargados. Cada partido nuevo se clasifica en
su fase (`round`) según el `intRound` que devuelve TheSportsDB.

---

## Stack técnico

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- [React Router](https://reactrouter.com/) (HashRouter, compatible con GitHub Pages)
- [Firebase](https://firebase.google.com/) (Auth + Firestore, plan Spark/gratuito)
- [lucide-react](https://lucide.dev/) para íconos
- [gh-pages](https://www.npmjs.com/package/gh-pages) para el deploy

## Estructura del proyecto

```
src/
  components/       # UI reutilizable (Layout, MatchCard, ScoreSpinner, admin/...)
  contexts/          # AuthContext (sesión, perfil, settings, rol admin)
  data/              # Fixture real del Mundial 2026 (Fecha 1, fase de grupos)
  hooks/             # useAutoSyncResults (sincronización automática de resultados)
  lib/firebase.ts    # Inicialización de Firebase
  pages/             # Dashboard, Matches, MyPredictions, Prizes, Admin, Login
  services/          # Acceso a Firestore + TheSportsDB (matches, predictions, users, settings, sportsApi)
  types/             # Tipos compartidos (Match, Prediction, UserProfile, ...)
  utils/             # calculatePoints, calculateWinners, formatters
firestore.rules
firestore.indexes.json
firebase.json
```
