import { Goal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <div
      className="page center"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}
    >
      <Goal size={64} color="var(--color-gold)" />
      <h1 style={{ fontSize: '3rem', margin: '1rem 0 0.25rem', color: 'var(--color-gold)' }}>
        Mundial Prode
      </h1>
      <p className="muted" style={{ marginBottom: '2rem' }}>
        Pronosticá los partidos del Mundial 2026 y competí por el premio
      </p>
      <button className="btn btn-primary" onClick={() => signInWithGoogle()}>
        Iniciar sesión con Google
      </button>
    </div>
  );
}
