import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ChampionPickCard from './ChampionPickCard';
import type { AppSettings } from '../types';

const baseSettings: AppSettings = {
  prizePool: 0,
  currency: 'ARS',
  distribution: [70, 30],
  adminUIDs: [],
  champion: null,
  championBonus: 25,
  championPicksLocked: false,
};

const teams = ['Argentina', 'Brasil', 'Francia'];

describe('ChampionPickCard', () => {
  it('lets the user pick a team and save it', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ChampionPickCard teams={teams} pick={null} settings={baseSettings} onSave={onSave} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), 'Argentina');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(onSave).toHaveBeenCalledWith('Argentina');
  });

  it('disables the picker and hides the save button once picks are locked', () => {
    render(
      <ChampionPickCard
        teams={teams}
        pick={{ uid: 'user-1', team: 'Argentina' }}
        settings={{ ...baseSettings, championPicksLocked: true }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
    expect(screen.getByText('Cerrado')).toBeInTheDocument();
  });

  it('shows the official champion and the bonus earned once it is decided', () => {
    render(
      <ChampionPickCard
        teams={teams}
        pick={{ uid: 'user-1', team: 'Argentina' }}
        settings={{ ...baseSettings, champion: 'Argentina', championPicksLocked: true }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getAllByText('Argentina')).toHaveLength(2);
    expect(screen.getByText('+25 pts')).toBeInTheDocument();
    expect(screen.getByText('Definido')).toBeInTheDocument();
  });

  it('shows no bonus when the champion is decided but the user picked wrong', () => {
    render(
      <ChampionPickCard
        teams={teams}
        pick={{ uid: 'user-1', team: 'Brasil' }}
        settings={{ ...baseSettings, champion: 'Argentina', championPicksLocked: true }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText('+0 pts')).toBeInTheDocument();
  });
});
