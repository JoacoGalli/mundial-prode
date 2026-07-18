import { Lock, Trophy } from 'lucide-react';
import type { ChampionPick, UserProfile } from '../types';
import { getChampionPoints } from '../utils/prizes';

interface FinalistsCardProps {
  finalists: string[];
  picks: ChampionPick[];
  usersById: Record<string, UserProfile>;
  championBonus: number;
}

export default function FinalistsCard({ finalists, picks, usersById, championBonus }: FinalistsCardProps) {
  const visiblePicks = picks.filter((p) => p.uid in usersById && p.teams?.length > 0);

  return (
    <div className="ticket">
      <div className="ticket-body">
        <div className="ticket-header">
          <span className="ticket-stage">Finalistas</span>
        </div>

        <div className="ticket-teams">
          <span className="ticket-team">{finalists[0]}</span>
          <span className="ticket-vs">
            <Trophy size={16} color="var(--color-gold)" />
          </span>
          <span className="ticket-team">{finalists[1]}</span>
        </div>

        <div className="center" style={{ marginTop: '0.25rem' }}>
          <span className="badge badge-locked">
            <Lock size={12} /> Definido
          </span>
        </div>

        <hr className="ticket-divider" />

        {visiblePicks.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Todavía nadie eligió sus finalistas.</p>
        ) : (
          visiblePicks
            .slice()
            .sort((a, b) => (usersById[a.uid]?.name ?? a.uid).localeCompare(usersById[b.uid]?.name ?? b.uid))
            .map((pick) => {
              const u = usersById[pick.uid];
              const points = getChampionPoints(pick, finalists, championBonus);
              return (
                <div key={pick.uid} className="flex-between" style={{ padding: '0.25rem 0' }}>
                  <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                    {u?.photoURL && (
                      <img src={u.photoURL} alt={u.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    )}
                    <span>{u?.name ?? 'Jugador'}</span>
                  </div>
                  <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                    <span>{pick.teams.join(' y ')}</span>
                    <span className="badge badge-points">+{points} pts</span>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
