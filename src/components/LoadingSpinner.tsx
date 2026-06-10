import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="center" style={{ padding: '3rem' }}>
      <Loader2 className="spin" size={32} color="var(--color-gold)" />
    </div>
  );
}
