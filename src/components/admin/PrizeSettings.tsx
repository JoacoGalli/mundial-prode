import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { DISTRIBUTION_PRESETS } from '../../utils/prizes';

interface PrizeSettingsProps {
  prizePool: number;
  currency: 'ARS' | 'USD';
  distribution: number[];
  onSave: (data: { prizePool: number; currency: 'ARS' | 'USD'; distribution: number[] }) => Promise<void>;
}

export default function PrizeSettings({ prizePool: initialPrizePool, currency: initialCurrency, distribution: initialDistribution, onSave }: PrizeSettingsProps) {
  const [prizePool, setPrizePool] = useState(initialPrizePool);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(initialCurrency);
  const [distribution, setDistribution] = useState<number[]>(initialDistribution);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrizePool(initialPrizePool);
    setCurrency(initialCurrency);
    setDistribution(initialDistribution);
  }, [initialPrizePool, initialCurrency, initialDistribution]);

  const total = distribution.reduce((a, b) => a + b, 0);
  const isValid = total === 100 && distribution.length > 0;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await onSave({ prizePool, currency, distribution });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const updateDistAt = (i: number, value: number) => {
    setDistribution((d) => d.map((v, idx) => (idx === i ? value : v)));
  };

  const addPlace = () => setDistribution((d) => [...d, 0]);
  const removePlace = (i: number) => setDistribution((d) => d.filter((_, idx) => idx !== i));

  return (
    <div className="card section">
      <h3 className="muted" style={{ marginBottom: '0.75rem' }}>Configuración de premios</h3>

      <div className="flex gap-md" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <label className="muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            Pozo total
          </label>
          <input
            className="input"
            type="number"
            min={0}
            value={prizePool}
            onChange={(e) => setPrizePool(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div>
          <label className="muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            Moneda
          </label>
          <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD')}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <label className="muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        Distribución (presets)
      </label>
      <div className="flex gap-sm" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
        {DISTRIBUTION_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="btn btn-secondary"
            onClick={() => setDistribution(preset.values)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <label className="muted" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        Distribución personalizada (debe sumar 100%)
      </label>
      <div className="flex gap-sm" style={{ flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
        {distribution.map((pct, i) => (
          <div key={i} className="flex gap-sm" style={{ alignItems: 'center' }}>
            <span className="muted">{i + 1}°</span>
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              style={{ width: '5rem' }}
              value={pct}
              onChange={(e) => updateDistAt(i, Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            />
            <span className="muted">%</span>
            <button className="btn btn-secondary" onClick={() => removePlace(i)} title="Quitar puesto">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button className="btn btn-secondary" onClick={addPlace} title="Agregar puesto">
          <Plus size={14} />
        </button>
      </div>

      <p className={total === 100 ? 'muted' : ''} style={{ color: total === 100 ? undefined : 'var(--color-red)' }}>
        Total: {total}% {total !== 100 && '— debe sumar 100%'}
      </p>

      <button className="btn btn-primary" onClick={handleSave} disabled={!isValid || saving}>
        {saving ? <Loader2 size={16} className="spin" /> : saved ? 'Guardado ✓' : 'Guardar configuración'}
      </button>
    </div>
  );
}
