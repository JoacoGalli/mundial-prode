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
9. [Grupos / Torneos privados](#grupos--torneos-privados)

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
- **Pronóstico de Campeón**: cada jugador elige una vez qué selección cree
  que va a salir campeona (entre todos los equipos del fixture cargado).
  Cuando el admin confirma el campeón real, quienes acertaron suman un bonus
  a su puntaje (configurable, por defecto 25 pts globales y editable por
  grupo, ver [Grupos](#grupos--torneos-privados)).
- **Premios**: muestra el pozo total, la distribución configurada y el pago
  estimado por posición según la tabla actual.
- **Grupos / Torneos privados**: cualquier usuario puede crear su propio
  grupo, compartir un link de invitación y, como admin del grupo, aprobar
  miembros y configurar el pozo de premios y el bonus de campeón de ese
  grupo (ver sección dedicada más abajo).
- **Resultados automáticos**: cada partido del fixture incluye los nombres de
  los equipos tal como los reporta [TheSportsDB](https://www.thesportsdb.com/).
  Cada vez que un admin abre la app, se consulta TheSportsDB para los
  partidos ya jugados sin resultado cargado y, si ya finalizaron, se aplica
  el resultado solo — esto dispara el recálculo automático de puntos de
  todos los pronósticos. No hace falta cargar resultados a mano.
- **Panel de Admin** (`/admin`):
  - Cargar el fixture completo del Mundial 2026 (Fecha 1, 2 y 3 de la fase de
    grupos, 72 partidos de los 12 grupos A-L) con un botón.
  - "Actualizar fixture desde API": consulta TheSportsDB y agrega los
    partidos nuevos que se vayan publicando (llaves de eliminación directa)
    sin tocar los partidos ni pronósticos existentes.
  - "Reemplazar fixture completo": borra todos los partidos y pronósticos
    actuales y vuelve a cargar el fixture completo de 72 partidos — útil para
    actualizar instalaciones que solo tenían cargada la Fecha 1.
  - Cargar/editar manualmente el resultado oficial de cada partido si hace
    falta (esto también recalcula los puntos de todos los pronósticos para
    ese partido y el total de cada jugador).
  - Bloquear/desbloquear partidos manualmente.
  - Configurar los puntos de bonus por acertar el campeón, abrir/cerrar los
    pronósticos de campeón, y confirmar el campeón real (recalcula los
    puntos de todos los jugadores y cierra los pronósticos).
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
VITE_FOOTBALL_DATA_API_KEY=tu_api_key_de_football-data.org
```

> ⚠️ Si vas a deployar a GitHub Pages, también necesitás cargar estas mismas
> variables como **GitHub Actions secrets** o reemplazarlas antes del build,
> ya que `.env.local` no se commitea. Una opción simple es crear un
> `.env.production` local (tampoco commiteado) con los mismos valores antes
> de correr `npm run deploy`.

### Resultados: TheSportsDB + football-data.org

Los resultados oficiales y el marcador en vivo se sincronizan automáticamente
desde [TheSportsDB](https://www.thesportsdb.com/) (no requiere API key). Como
esa API gratuita a veces no lista algún partido puntual (pasó con Australia
vs Turquía y Países Bajos vs Japón en la Fecha 1), la app usa
[football-data.org](https://www.football-data.org/) como respaldo cuando
TheSportsDB no encuentra el partido. Sacá una API key gratis en
https://www.football-data.org/client/register (cubre el Mundial en el plan
gratuito) y agregala como `VITE_FOOTBALL_DATA_API_KEY`. Si no la configurás,
la app sigue funcionando normalmente, solo sin ese respaldo.

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

## Fixture y sincronización automática de resultados

El fixture de la fase de grupos (`src/data/matches.ts`, 72 partidos: Fecha 1,
2 y 3 de los grupos A-L) sale del repo
[openfootball/worldcup.json](https://github.com/openfootball/worldcup.json),
que publica el calendario completo del Mundial 2026 con fechas y horarios
oficiales. Cada partido guarda, además del nombre de los equipos en español
(`teamA`/`teamB`), el nombre que usa [TheSportsDB](https://www.thesportsdb.com/)
para esos mismos equipos (`apiTeamA`/`apiTeamB`), que se usa para buscar el
resultado oficial automáticamente.

Funcionamiento (`src/hooks/useAutoSyncResults.ts`):

1. Cada vez que un **admin** abre la app, y después cada **2 horas** mientras
   la deje abierta, el hook revisa todos los partidos.
2. Para los que ya arrancaron (`locked` o `datetime` pasada) y todavía no
   tienen `result` cargado, consulta
   `GET https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d={fecha}&l=4429`
   (liga **FIFA World Cup**, id `4429`, API pública gratuita key `3`, sin
   necesidad de registro) y busca el evento cuyo `strHomeTeam`/`strAwayTeam`
   coincidan con `apiTeamA`/`apiTeamB` (probando también el día anterior y
   siguiente, por si TheSportsDB lo lista en una fecha distinta por husos
   horarios).
3. Si TheSportsDB ya tiene `intHomeScore`/`intAwayScore` (partido finalizado),
   se llama a `setMatchResult(matchId, result)` automáticamente — esto marca
   el partido como `locked` y recalcula los puntos de todos los pronósticos
   y el `totalPoints` de cada jugador.
4. Si un partido todavía no tiene resultado en TheSportsDB se vuelve a
   consultar en el siguiente ciclo (cada 2 horas), hasta que aparezca.
5. En el mismo ciclo de 2 horas también se ejecuta automáticamente
   "Actualizar fixture desde API" (ver más abajo), así no hace falta
   acordarse de cargar las llaves de eliminación directa a mano.

> ⚠️ Esto requiere que un admin tenga la app abierta en algún momento después
> de que termine un partido (o pase el ciclo de 2hs) para que se dispare la
> sincronización (no hay backend/cron, es Spark/gratis). Si necesitás
> forzarlo, basta con recargar la página estando logueado como admin. Si
> querés cargar un resultado a mano (por ejemplo si TheSportsDB todavía no lo
> actualizó), podés seguir haciéndolo desde la tabla de partidos del panel de
> Admin.

### Llaves de eliminación directa

TheSportsDB todavía no publica los cruces de Dieciseisavos en adelante. A
medida que se confirmen, un admin con la app abierta los va a recibir
automáticamente (cada 2 horas, ver arriba). Si no querés esperar, también
podés ir al panel de Admin y tocar **"Actualizar fixture desde API"** para
forzarlo: la app vuelve a consultar `eventsseason.php` y agrega como partidos
nuevos sólo los que todavía no estén en Firestore (comparando por equipos +
fase), sin afectar los partidos ni pronósticos ya cargados. Cada partido
nuevo se clasifica en su fase (`round`) según el `intRound` que devuelve
TheSportsDB.

---

## Grupos / Torneos privados

Además de la tabla y los premios "globales" (pestañas **Tabla** y **Premios**,
configurados desde `/admin`), cualquier usuario puede crear sus propios
**grupos** (torneos privados entre amigos/familia/laburo) desde la pestaña
**Grupos**:

- Los pronósticos de partidos y el pick de campeón son **únicos por
  usuario** (no cambian entre grupos): lo que varía por grupo es el **pozo de
  premios**, su **distribución** y el **bonus por acertar el campeón**.
- **Crear un grupo**: cualquier usuario logueado puede crear uno desde
  `/groups`, eligiendo un nombre. Queda automáticamente como dueño/admin.
- **Invitar gente**: desde `/groups/:id/admin` el admin del grupo encuentra un
  link de invitación (`#/join/<código>`) para compartir. También puede
  regenerar el código en cualquier momento (invalida el link anterior).
- **Unirse a un grupo**: al abrir el link de invitación (o pegando el código
  en `/groups`), el usuario queda en estado **pendiente** hasta que un admin
  del grupo lo apruebe desde `/groups/:id/admin`.
- **Administrar un grupo**: los admins pueden cambiar el nombre, el pozo de
  premios (monto, moneda y distribución, igual que en `/admin` global) y el
  bonus de campeón propio del grupo, además de aprobar/rechazar solicitudes y
  quitar miembros.
- **Tabla y premios por grupo**: `/groups/:id` muestra el ranking y los
  premios calculados solo entre los miembros aprobados de ese grupo, usando
  los puntos de pronósticos de cada uno más el bonus de campeón **de ese
  grupo** (si el campeón real ya está confirmado y el pronóstico de campeón
  del jugador coincide).

> ⚠️ Configuración adicional en Firebase: además de `firestore.rules`
> (volver a pegar y publicar), esta función necesita un **índice de
> "collection group"** para poder buscar "mis grupos" de forma eficiente.
> Andá a Firestore Database > pestaña **Indexes** > **Composite indexes** >
> **Add index**, y creá uno con:
> - Collection ID: `members`
> - Query scope: **Collection group**
> - Campo: `uid`, orden Ascending
>
> Es un paso único; una vez creado (puede tardar uno o dos minutos en estar
> listo), todo funciona automáticamente.

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
  data/              # Fixture real del Mundial 2026 (Fecha 1-3, fase de grupos)
  hooks/             # useAutoSyncResults (sincronización automática de resultados)
  lib/firebase.ts    # Inicialización de Firebase
  pages/             # Dashboard, Matches, MyPredictions, Prizes, Admin, Login,
                     # Groups, GroupDetail, GroupAdmin, JoinGroup
  services/          # Acceso a Firestore + TheSportsDB (matches, predictions, users, settings, sportsApi, groups)
  types/             # Tipos compartidos (Match, Prediction, UserProfile, ...)
  utils/             # calculatePoints, calculateWinners, formatters
firestore.rules
firestore.indexes.json
firebase.json
```
