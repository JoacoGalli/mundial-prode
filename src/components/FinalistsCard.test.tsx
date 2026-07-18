import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FinalistsCard from './FinalistsCard';
import type { UserProfile } from '../types';

const usersById: Record<string, UserProfile> = {
  'user-1': { uid: 'user-1', name: 'Joaco', email: '', photoURL: '', predictionPoints: 0, joinedAt: null as any },
  'user-2': { uid: 'user-2', name: 'Ana', email: '', photoURL: '', predictionPoints: 0, joinedAt: null as any },
};

describe('FinalistsCard', () => {
  it('shows the official finalists', () => {
    render(
      <FinalistsCard
        finalists={['Argentina', 'España']}
        picks={[]}
        usersById={usersById}
        championBonus={25}
      />
    );

    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('España')).toBeInTheDocument();
    expect(screen.getByText('Definido')).toBeInTheDocument();
  });

  it('lists each visible participant with their pick and points earned', () => {
    render(
      <FinalistsCard
        finalists={['Argentina', 'España']}
        picks={[
          { uid: 'user-1', teams: ['Argentina', 'Brasil'] },
          { uid: 'user-2', teams: ['Argentina', 'España'] },
        ]}
        usersById={usersById}
        championBonus={25}
      />
    );

    expect(screen.getByText('Joaco')).toBeInTheDocument();
    expect(screen.getByText('Argentina y Brasil')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Argentina y España')).toBeInTheDocument();
    expect(screen.getByText('+25 pts')).toBeInTheDocument();
    expect(screen.getByText('+50 pts')).toBeInTheDocument();
  });

  it('hides picks from users outside the current scope', () => {
    render(
      <FinalistsCard
        finalists={['Argentina', 'España']}
        picks={[{ uid: 'outsider', teams: ['Argentina', 'España'] }]}
        usersById={usersById}
        championBonus={25}
      />
    );

    expect(screen.getByText('Todavía nadie eligió sus finalistas.')).toBeInTheDocument();
  });
});
