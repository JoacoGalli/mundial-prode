import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ScoreSpinner from './ScoreSpinner';

describe('ScoreSpinner', () => {
  it('renders the current value', () => {
    render(<ScoreSpinner value={3} onChange={vi.fn()} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(3);
  });

  it('calls onChange with value + 1 when the plus button is clicked', async () => {
    const onChange = vi.fn();
    render(<ScoreSpinner value={2} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sumar gol' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('calls onChange with value - 1 when the minus button is clicked', async () => {
    const onChange = vi.fn();
    render(<ScoreSpinner value={2} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Restar gol' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('does not go below 0 and disables the minus button at 0', () => {
    const onChange = vi.fn();
    render(<ScoreSpinner value={0} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Restar gol' })).toBeDisabled();
  });

  it('disables the plus button at 99', () => {
    const onChange = vi.fn();
    render(<ScoreSpinner value={99} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Sumar gol' })).toBeDisabled();
  });

  it('disables all controls when disabled is true', () => {
    render(<ScoreSpinner value={1} onChange={vi.fn()} disabled />);
    expect(screen.getByRole('spinbutton')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Restar gol' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sumar gol' })).toBeDisabled();
  });

  it('clamps manual input to the 0-99 range', () => {
    const onChange = vi.fn();
    render(<ScoreSpinner value={5} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '150' } });
    expect(onChange).toHaveBeenCalledWith(99);
  });
});
