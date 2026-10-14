export const STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];
export const CATEGORIES = [
  { value: 'overflowing_bin', label: 'Overflowing bin' },
  { value: 'illegal_dumping', label: 'Illegal dumping' },
  { value: 'street_litter', label: 'Street litter' },
  { value: 'missed_collection', label: 'Missed collection' },
];
export const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label || v;
export const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label || v;
export const cid = (c) => c?._id || c?.id;
export const shortId = (c) => String(cid(c) || '').slice(-8).toUpperCase();
export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
export const unwrap = (res, key) => res.data?.[key] ?? res.data;

// Pending = submitted or assigned; active = anything not resolved.
export function summarize(list) {
  const count = (fn) => list.filter(fn).length;
  return {
    total: list.length,
    pending: count((c) => c.status === 'submitted' || c.status === 'assigned'),
    inProgress: count((c) => c.status === 'in_progress'),
    resolved: count((c) => c.status === 'resolved'),
    active: count((c) => c.status !== 'resolved'),
  };
}
