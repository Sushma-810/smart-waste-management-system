import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi } from '../services/api.js';
import useAsync from '../hooks/useAsync.js';
import { CATEGORIES, STATUSES, summarize, unwrap } from '../utils.js';
import { ErrorState, PageHeader, Spinner, StatCard } from '../components/ui.jsx';
import ComplaintTable from '../components/ComplaintTable.jsx';

const STATUS_COLORS = { submitted: '#9aa5a0', assigned: '#d9a21b', in_progress: '#2f7fb8', resolved: '#1f7a4d' };

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => adminApi.list().then((r) => unwrap(r, 'complaints')), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const list = Array.isArray(data) ? data : [];
  const s = summarize(list);
  const byCategory = CATEGORIES.map((c) => ({ name: c.label, count: list.filter((x) => x.category === c.value).length }));
  const byStatus = STATUSES.map((st) => ({ name: st.label, value: list.filter((x) => x.status === st.value).length, key: st.value }));

  return (
    <>
      <PageHeader title="Administrator overview" subtitle="Live figures from all citizen complaints." />
      <div className="grid4">
        <StatCard label="Total complaints" value={s.total} />
        <StatCard label="Pending" value={s.pending} tone="warn" />
        <StatCard label="Resolved" value={s.resolved} tone="good" />
        <StatCard label="Active reports" value={s.active} tone="info" />
      </div>
      <div className="grid2">
        <section className="card">
          <h2>Complaints by category</h2>
          <div className="chart" role="img" aria-label="Bar chart of complaints by category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Complaints" fill="#2a9d63" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card">
          <h2>Resolution status</h2>
          <div className="chart" role="img" aria-label="Pie chart of complaints by status">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {byStatus.filter((d) => d.value > 0).map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <h2>Complaints</h2>
      <ComplaintTable complaints={list} />
    </>
  );
}
