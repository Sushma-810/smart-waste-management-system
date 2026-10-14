import { complaintsApi } from '../services/api.js';
import useAsync from '../hooks/useAsync.js';
import { unwrap } from '../utils.js';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui.jsx';
import ComplaintList from '../components/ComplaintList.jsx';

export default function MyComplaints() {
  const { data, loading, error, reload } = useAsync(() => complaintsApi.mine().then((r) => unwrap(r, 'complaints')), []);
  const list = Array.isArray(data) ? [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
  return (
    <>
      <PageHeader title="My complaints" subtitle="Select a complaint to track its progress." />
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="card">
          {list.length === 0
            ? <EmptyState title="No complaint history" text="Reports you submit will appear here." action={{ to: '/report', label: 'Report waste' }} />
            : <ComplaintList complaints={list} />}
        </div>
      )}
    </>
  );
}
