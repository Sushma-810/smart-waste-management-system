import { adminApi } from '../services/api.js';
import useAsync from '../hooks/useAsync.js';
import { unwrap } from '../utils.js';
import { ErrorState, PageHeader, Spinner } from '../components/ui.jsx';
import ComplaintTable from '../components/ComplaintTable.jsx';

export default function AdminComplaints() {
  const { data, loading, error, reload } = useAsync(() => adminApi.list().then((r) => unwrap(r, 'complaints')), []);
  return (
    <>
      <PageHeader title="All complaints" subtitle="Search, filter and open a complaint to manage it." />
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : <ComplaintTable complaints={Array.isArray(data) ? data : []} />}
    </>
  );
}
