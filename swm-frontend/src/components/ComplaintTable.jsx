import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, STATUSES, categoryLabel, cid, formatDate, shortId } from '../utils.js';
import { EmptyState, StatusBadge } from './ui.jsx';

export default function ComplaintTable({ complaints }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return complaints.filter((c) =>
      (!status || c.status === status) &&
      (!category || c.category === category) &&
      (!term || [c.title, c.address, c.location, shortId(c), c.user?.name].some((v) => String(v || '').toLowerCase().includes(term)))
    );
  }, [complaints, q, status, category]);

  return (
    <div className="card">
      <div className="filters">
        <input type="search" aria-label="Search complaints" placeholder="Search by title, address, ID or citizen" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No complaints match" text="Try clearing the search or filters." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Address</th><th>Date</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={cid(c)}>
                  <td>{shortId(c)}</td><td>{c.title}</td><td>{categoryLabel(c.category)}</td>
                  <td>{c.address || c.location}</td><td>{formatDate(c.createdAt)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><Link to={`/admin/complaints/${cid(c)}`}>Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
