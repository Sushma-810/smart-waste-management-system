import { Link } from 'react-router-dom';
import { categoryLabel, cid, formatDate, shortId } from '../utils.js';
import { StatusBadge } from './ui.jsx';

export default function ComplaintList({ complaints }) {
  return (
    <ul className="clist">
      {complaints.map((c) => (
        <li key={cid(c)}>
          <Link to={`/complaints/${cid(c)}`}>
            <span><strong>{c.title}</strong><br /><small className="muted">#{shortId(c)} · {categoryLabel(c.category)} · {formatDate(c.createdAt)}</small></span>
            <StatusBadge status={c.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
