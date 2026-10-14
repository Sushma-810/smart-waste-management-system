import { Link } from 'react-router-dom';
import { complaintsApi } from '../services/api.js';
import useAsync from '../hooks/useAsync.js';
import { summarize, unwrap } from '../utils.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState, PageHeader, Spinner, StatCard } from '../components/ui.jsx';
import ComplaintList from '../components/ComplaintList.jsx';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => complaintsApi.mine().then((r) => unwrap(r, 'complaints')), []);
  const list = Array.isArray(data) ? [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
  const s = summarize(list);

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle="Here is where your reports stand."
        action={<Link className="btn" to="/report">Report new waste problem</Link>} />
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="grid4">
            <StatCard label="Total complaints" value={s.total} />
            <StatCard label="Pending" value={s.pending} tone="warn" />
            <StatCard label="In progress" value={s.inProgress} tone="info" />
            <StatCard label="Resolved" value={s.resolved} tone="good" />
          </div>
          <section className="card">
            <div className="row between"><h2>Recent complaints</h2><Link to="/complaints">View all</Link></div>
            {list.length === 0
              ? <EmptyState title="No complaints yet" text="Spotted waste that needs collecting? Report it and we’ll route it to the right team." action={{ to: '/report', label: 'Report waste' }} />
              : <ComplaintList complaints={list.slice(0, 5)} />}
          </section>
        </>
      )}
    </>
  );
}
