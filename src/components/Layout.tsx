import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Trophy, ShieldCheck, LogOut, Goal, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, profile, isAdmin, logOut } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand">
            <Goal size={26} color="var(--color-gold)" />
            <span>Mundial Prode</span>
          </div>
          {user && (
            <div className="user-chip">
              {profile?.photoURL && <img src={profile.photoURL} alt={profile.name} />}
              <span className="muted">{profile?.name}</span>
              <button className="btn btn-secondary" onClick={logOut} title="Cerrar sesión">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {user && (
        <nav className="bottom-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <LayoutDashboard size={20} />
            <span>Tabla</span>
          </NavLink>
          <NavLink to="/matches" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Goal size={20} />
            <span>Partidos</span>
          </NavLink>
          <NavLink to="/predictions" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ListChecks size={20} />
            <span>Mis Pronósticos</span>
          </NavLink>
          <NavLink to="/prizes" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Trophy size={20} />
            <span>Premios</span>
          </NavLink>
          <NavLink
            to="/groups"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Users size={20} />
            <span>Grupos</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              <ShieldCheck size={20} />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>
      )}
    </div>
  );
}
