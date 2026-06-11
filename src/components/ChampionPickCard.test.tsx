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
  finalists: null,
  championBonus: 25,
  championPicksLocked: false,
};

const teams = ['Argentina', 'Brasil', 'Francia', 'España'];

describe('ChampionPickCard', () => {
  it('lets the user pick two finalists and save them', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ChampionPickCard teams={teams} pick={null} settings={baseSettings} onSave={onSave} />);

    const [select1, select2] = screen.getAllByRole('combobox');
    await userEvent.selectOptions(select1, 'Argentina');
    await userEvent.selectOptions(select2, 'Brasil');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(onSave).toHaveBeenCalledWith(['Argentina', 'Brasil']);
  });

  it('disables the pickers and hides the save button once picks are locked', () => {
    render(
      <ChampionPickCard
        teams={teams}
        pick={{ uid: 'user-1', teams: ['Argentina', 'Brasil'] }}
        settings={{ ...baseSettings, championPicksLocked: true }}
        onSave={vi.fn()}
      />
    );

    for (const select of screen.getAllByRole('combobox')) {
      expect(select).toBeDisabled();
    }
    expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
    expect(screen.getByText('Cerrado')).toBeInTheDocument();
  });

  it('shows the official finalists and the bonus earned for one correct pick', () => {
    render(
      <ChampionPickCard
        teams={teams}
        pick={{ uid: 'user-1', teams: ['Argentina', 'Brasil'] }}
        settings={{ ...baseSettings, finalists: ['Argentina', 'España'], championPicksLocked: true }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText('Argentina', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Argentina y Brasil')).toBeInTheDocument();
    expect(screen.getByText('+25 pts')).toBeInTheDocument();
    expect(screen.getByText('Definido')).toBeInTheDocument();
  });

  it('shows double the bonus when both finalists are picked correctly', () => {
    render(
      <ChampionPickCard
        teams={teams}
        pick={{ uid: 'user-1', teams: ['Argentina', 'España'] }}
        settings={{ ...baseSettings, finalists: ['Argentina', 'España'], championPicksLocked: true }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText('+50 pts')).toBeInTheDocument();
  });

  it('shows no bonus when the finalists are decided but neither pick matches', () => {
    render(
      <ChampionPickCard
        teams={teams}
        pick={{ uid: 'user-1', teams: ['Brasil', 'Francia'] }}
        settings={{ ...baseSettings, finalists: ['Argentina', 'España'], championPicksLocked: true }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText('+0 pts')).toBeInTheDocument();
  });
});
