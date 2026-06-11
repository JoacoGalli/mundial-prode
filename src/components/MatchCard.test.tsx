import { Timestamp } from 'firebase/firestore';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MatchCard from './MatchCard';
import type { Match, Prediction, UserProfile } from '../types';

const subscribeToMatchPredictions = vi.fn();

vi.mock('../services/predictions', () => ({
  subscribeToMatchPredictions: (...args: unknown[]) => subscribeToMatchPredictions(...args),
}));

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    teamA: 'Argentina',
    teamB: 'Brasil',
    datetime: Timestamp.fromDate(new Date(Date.now() + 1000 * 60 * 60)),
    stage: 'Grupo A',
    round: 'Fecha 1',
    result: null,
    locked: false,
    ...overrides,
  };
}

function makePrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    id: 'pred-1',
    uid: 'user-1',
    matchId: 'match-1',
    home: 1,
    away: 0,
    points: null,
    scoredAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  subscribeToMatchPredictions.mockReturnValue(() => {});
});

describe('MatchCard', () => {
  it('shows team names and "vs" when there is no result yet', () => {
    render(<MatchCard match={makeMatch()} />);
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Brasil')).toBeInTheDocument();
    expect(screen.getByText('vs')).toBeInTheDocument();
  });

  it('shows the official score once the match has a result', () => {
    render(<MatchCard match={makeMatch({ result: { home: 2, away: 1 }, locked: true })} />);
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
  });

  it('shows "Abierto" for an open match and reports score changes via onChange', async () => {
    const onChange = vi.fn();
    render(<MatchCard match={makeMatch()} onChange={onChange} />);

    expect(screen.getByText('Abierto')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Sumar gol' })[0]);
    expect(onChange).toHaveBeenCalledWith(1, 0);
  });

  it('shows "Cerrado" for a locked match', () => {
    render(<MatchCard match={makeMatch({ locked: true })} />);
    expect(screen.getByText('Cerrado')).toBeInTheDocument();
  });

  it('shows the live score and a "EN VIVO" badge while the match is in progress', () => {
    render(
      <MatchCard
        match={makeMatch({ locked: true, liveScore: { home: 1, away: 0 }, liveStatus: '1H' })}
      />
    );
    expect(screen.getByText('1 - 0')).toBeInTheDocument();
    expect(screen.getByText(/EN VIVO/)).toBeInTheDocument();
    expect(screen.getByText(/1er Tiempo/)).toBeInTheDocument();
  });

  it('shows partial points for a prediction while the match is live', () => {
    render(
      <MatchCard
        match={makeMatch({ locked: true, liveScore: { home: 1, away: 0 }, liveStatus: '1H' })}
        prediction={makePrediction({ home: 1, away: 0, points: null })}
      />
    );
    expect(screen.getByText('+12 pts (parcial)')).toBeInTheDocument();
  });

  it('shows the points earned for a scored prediction', () => {
    render(
      <MatchCard
        match={makeMatch({ result: { home: 1, away: 0 }, locked: true })}
        prediction={makePrediction({ home: 1, away: 0, points: 12 })}
      />
    );
    expect(screen.getByText('+12 pts')).toBeInTheDocument();
  });

  it('does not offer to view others\' predictions while the match is still open', () => {
    render(<MatchCard match={makeMatch()} />);
    expect(screen.queryByRole('button', { name: /ver pronósticos/i })).not.toBeInTheDocument();
  });

  it('lets users reveal everyone\'s predictions once the match is locked', async () => {
    const usersById: Record<string, UserProfile> = {
      'user-1': { uid: 'user-1', name: 'Beto', email: '', photoURL: '', predictionPoints: 0, joinedAt: Timestamp.now() },
      'user-2': { uid: 'user-2', name: 'Ana', email: '', photoURL: '', predictionPoints: 0, joinedAt: Timestamp.now() },
    };
    subscribeToMatchPredictions.mockImplementation((_matchId: string, cb: (preds: Prediction[]) => void) => {
      cb([
        makePrediction({ uid: 'user-1', home: 2, away: 0, points: 7 }),
        makePrediction({ id: 'pred-2', uid: 'user-2', home: 1, away: 1, points: null }),
      ]);
      return () => {};
    });

    render(<MatchCard match={makeMatch({ locked: true })} usersById={usersById} />);

    await userEvent.click(screen.getByRole('button', { name: /ver pronósticos/i }));

    expect(subscribeToMatchPredictions).toHaveBeenCalledWith('match-1', expect.any(Function));

    // Sorted alphabetically by name: Ana before Beto
    const names = screen.getAllByText(/^(Ana|Beto)$/).map((el) => el.textContent);
    expect(names).toEqual(['Ana', 'Beto']);
    expect(screen.getByText('1 - 1')).toBeInTheDocument();
    expect(screen.getByText('2 - 0')).toBeInTheDocument();
    expect(screen.getByText('+7 pts')).toBeInTheDocument();
  });

  it('hides predictions from users outside the given usersById scope (e.g. another group)', async () => {
    const usersById: Record<string, UserProfile> = {
      'user-1': { uid: 'user-1', name: 'Beto', email: '', photoURL: '', predictionPoints: 0, joinedAt: Timestamp.now() },
    };
    subscribeToMatchPredictions.mockImplementation((_matchId: string, cb: (preds: Prediction[]) => void) => {
      cb([
        makePrediction({ uid: 'user-1', home: 2, away: 0, points: 7 }),
        makePrediction({ id: 'pred-2', uid: 'user-2', home: 1, away: 1, points: null }),
      ]);
      return () => {};
    });

    render(<MatchCard match={makeMatch({ locked: true })} usersById={usersById} />);

    await userEvent.click(screen.getByRole('button', { name: /ver pronósticos/i }));

    expect(screen.getByText('Beto')).toBeInTheDocument();
    expect(screen.getByText('2 - 0')).toBeInTheDocument();
    expect(screen.queryByText('1 - 1')).not.toBeInTheDocument();
  });
});
