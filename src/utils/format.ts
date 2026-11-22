export function formatTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: Date | null, now: Date = new Date()): string {
  if (!date) return '—';
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (diffSec < 10) return "à l'instant";
  if (diffSec < 60) return `il y a ${diffSec} s`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `il y a ${h} h${min % 60 > 0 ? ` ${min % 60} min` : ''}`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}
