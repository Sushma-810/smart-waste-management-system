import { Link } from 'react-router-dom';
import { publicApi } from '../services/api.js';
import useAsync from '../hooks/useAsync.js';
import { StatCard } from '../components/ui.jsx';

const features = [
  ['Report in under a minute', 'Describe the problem, pin the location and attach a photo from your phone.'],
  ['Follow every step', 'See when your report is assigned, in progress and resolved.'],
  ['Clear accountability', 'Administrators assign each report to a team and update its status in one place.'],
];

export default function Home() {
  const { data, loading, error } = useAsync(() => publicApi.stats().then((r) => r.data), []);
  return (
    <>
      <section className="hero">
        <div>
          <h1>Overflowing bins and illegal dumps don’t clean themselves.</h1>
          <p className="lead">Uncollected waste spreads disease, attracts pests and blocks drains. Tell your local waste team exactly where the problem is and watch it get fixed.</p>
          <div className="row">
            <Link className="btn btn-lg" to="/report">Report waste</Link>
            <Link className="btn btn-ghost btn-lg" to="/login">Track a report</Link>
          </div>
        </div>
        <div className="hero-stats" aria-live="polite">
          {loading && <p className="muted">Loading live statistics…</p>}
          {error && <p className="muted">Live statistics are unavailable right now.</p>}
          {data && (
            <>
              <StatCard label="Total reports" value={data.total} />
              <StatCard label="Resolved" value={data.resolved} tone="good" />
              <StatCard label="Pending" value={data.pending} tone="warn" />
            </>
          )}
        </div>
      </section>
      <section className="features">
        {features.map(([t, d]) => <article key={t} className="card"><h3>{t}</h3><p>{d}</p></article>)}
      </section>
    </>
  );
}
