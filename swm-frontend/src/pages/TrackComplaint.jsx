import { Link, useParams } from 'react-router-dom';
import { complaintsApi, imageUrl } from '../services/api.js';
import useAsync from '../hooks/useAsync.js';
import { categoryLabel, formatDate, shortId, unwrap } from '../utils.js';
import { ErrorState, PageHeader, Spinner, StatusBadge } from '../components/ui.jsx';
import Timeline from '../components/Timeline.jsx';

export default function TrackComplaint() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => complaintsApi.get(id).then((r) => unwrap(r, 'complaint')), [id]);
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const c = data;
  return (
    <>
      <PageHeader title={c.title} subtitle={`Complaint #${shortId(c)}`} action={<StatusBadge status={c.status} />} />
      <section className="card"><Timeline status={c.status} history={c.history} /></section>
      <section className="card detail">
        <dl>
          <dt>Submitted</dt><dd>{formatDate(c.createdAt)}</dd>
          <dt>Category</dt><dd>{categoryLabel(c.category)}</dd>
          <dt>Location</dt><dd>{c.address}{c.location ? ` (${c.location})` : ''}</dd>
          <dt>Description</dt><dd>{c.description}</dd>
          {c.assignedTo && (<><dt>Assigned to</dt><dd>{c.assignedTo}</dd></>)}
        </dl>
        {c.imageUrl || c.image ? <img className="photo" src={imageUrl(c.imageUrl || c.image)} alt={`Photo submitted for ${c.title}`} /> : <p className="muted">No photo was attached.</p>}
      </section>
      <Link to="/complaints">← Back to my complaints</Link>
    </>
  );
}
