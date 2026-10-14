import { STATUSES, formatDate } from '../utils.js';

export default function Timeline({ status, history = [] }) {
  const current = Math.max(0, STATUSES.findIndex((s) => s.value === status));
  return (
    <ol className="timeline" aria-label="Complaint progress">
      {STATUSES.map((s, i) => {
        const entry = history.find((h) => h.status === s.value);
        const state = i < current || (i === current && status === 'resolved') ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={s.value} className={state} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="dot" />
            <strong>{s.label}</strong>
            <small>{entry ? formatDate(entry.at || entry.date) : state === 'todo' ? 'Waiting' : ''}</small>
          </li>
        );
      })}
    </ol>
  );
}
