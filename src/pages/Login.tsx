import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Goal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function errorMessage(code?: string): string {
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Este sitio no está autorizado para iniciar sesión todavía. Avisale al administrador para que agregue este dominio en Firebase (Authentication > Settings > Authorized domains).';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de inicio de sesión. Permití pop-ups para este sitio e intentá de nuevo.';
    case 'auth/network-request-failed':
      return 'Error de conexión. Revisá tu internet e intentá de nuevo.';
    default:
      return 'No se pudo iniciar sesión. Intentá de nuevo.';
  }
}

export default function Login() {
  const { user, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(errorMessage((err as { code?: string }).code));
    } finally {
      setLoading(false);
    }
  };

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
      <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
        {loading ? 'Conectando...' : 'Iniciar sesión con Google'}
      </button>
      {error && (
        <p style={{ color: 'var(--color-danger, #e25555)', marginTop: '1rem', maxWidth: 360, textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
}
