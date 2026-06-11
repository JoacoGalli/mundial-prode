import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HowItWorks() {
  const { settings } = useAuth();

  if (!settings) return <LoadingSpinner />;

  return (
    <div className="page">
      <h1 className="page-title">¿Cómo se puntúa?</h1>

      <div className="card section">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Pronósticos de partidos</h3>
        <p className="muted" style={{ marginTop: 0, fontSize: '0.9rem' }}>
          Por cada partido, cargás el resultado que creés que va a salir (ej. 2-1). Una vez
          jugado el partido, sumás puntos según qué tan acertado estuvo tu pronóstico:
        </p>
        <table>
          <thead>
            <tr>
              <th>Acierto</th>
              <th>Ejemplo (resultado real 2-1)</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Resultado exacto</td>
              <td>Pronosticaste 2-1</td>
              <td><span className="badge badge-points">12 pts</span></td>
            </tr>
            <tr>
              <td>Ganador correcto + un equipo con goles exactos</td>
              <td>Pronosticaste 3-1 o 2-0</td>
              <td><span className="badge badge-points">7 pts</span></td>
            </tr>
            <tr>
              <td>Solo el ganador correcto (o empate)</td>
              <td>Pronosticaste 1-0</td>
              <td><span className="badge badge-points">5 pts</span></td>
            </tr>
            <tr>
              <td>Goles exactos de un solo equipo, ganador equivocado</td>
              <td>Pronosticaste 2-3</td>
              <td><span className="badge badge-points">2 pts</span></td>
            </tr>
            <tr>
              <td>Nada acertado</td>
              <td>Pronosticaste 0-3</td>
              <td><span className="badge badge-points">0 pts</span></td>
            </tr>
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 0 }}>
          Solo se puede cargar o editar el pronóstico hasta el horario del partido. Una vez
          que arranca, queda bloqueado.
        </p>
      </div>

      <div className="card section">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Pronóstico del campeón</h3>
        <p className="muted" style={{ marginTop: 0, marginBottom: 0, fontSize: '0.9rem' }}>
          Además, elegís una vez (antes de que se cierren los pronósticos de campeón) qué
          selección creés que va a salir campeona del mundial. Si acertás, sumás{' '}
          <span className="badge badge-points">+{settings.championBonus} pts</span> extra a tu
          puntaje en la tabla general (<code>/</code> y <code>/premios</code>).
        </p>
      </div>

      <div className="card section">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Tabla de posiciones y premios</h3>
        <p className="muted" style={{ marginTop: 0, fontSize: '0.9rem' }}>
          Tu puntaje total es la suma de los puntos de todos tus pronósticos de partidos, más
          el bonus de campeón si corresponde:
        </p>
        <p className="card center" style={{ fontWeight: 600, margin: '0 0 0.75rem' }}>
          Puntaje total = puntos de pronósticos + bonus de campeón (si acertaste)
        </p>
        <p className="muted" style={{ marginTop: 0, marginBottom: 0, fontSize: '0.9rem' }}>
          Con ese puntaje se arma el ranking, y los primeros puestos se reparten el pozo de
          premios según el porcentaje de distribución configurado.
        </p>
      </div>

      <div className="card">
        <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Grupos / torneos privados</h3>
        <p className="muted" style={{ marginTop: 0, marginBottom: 0, fontSize: '0.9rem' }}>
          Tus pronósticos de partidos y tu pick de campeón son <strong>los mismos en toda la
          app</strong>. Lo que puede cambiar entre la tabla general y cada grupo al que te
          unas es el <strong>bonus de campeón</strong>, el <strong>pozo de premios</strong> y
          su <strong>distribución</strong>: cada grupo arma su propio ranking y premios a
          partir de tus mismos puntos de pronósticos.
        </p>
      </div>
    </div>
  );
}
