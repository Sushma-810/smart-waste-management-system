import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi, errorMessage, imageUrl } from '../services/api.js';
import useAsync from '../hooks/useAsync.js';
import { useToast } from '../context/ToastContext.jsx';
import { STATUSES, categoryLabel, formatDate, shortId, unwrap } from '../utils.js';
import { ErrorState, Field, PageHeader, Spinner, StatusBadge } from '../components/ui.jsx';
import Timeline from '../components/Timeline.jsx';

export default function ComplaintManagement() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => adminApi.get(id).then((r) => unwrap(r, 'complaint')), [id]);
  const [c, setC] = useState(null);
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('submitted');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) { setC(data); setAssignee(data.assignedTo || ''); setStatus(data.status); }
  }, [data]);

  const save = async (payload, message) => {
    setBusy(true);
    try {
      const res = await adminApi.update(id, payload);
      const updated = unwrap(res, 'complaint');
      setC((prev) => ({ ...prev, ...payload, ...(updated && typeof updated === 'object' ? updated : {}) }));
      if (updated?.status) setStatus(updated.status);
      toast.success(message);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally { setBusy(false); }
  };

  const assign = (e) => {
    e.preventDefault();
    if (!assignee.trim()) return toast.error('Enter who the complaint is assigned to.');
    const next = c.status === 'submitted' ? 'assigned' : c.status;
    setStatus(next);
    save({ assignedTo: assignee.trim(), status: next }, 'Complaint assigned.');
  };

  if (loading || (!c && !error)) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const lat = c.latitude ?? c.coordinates?.lat;
  const lng = c.longitude ?? c.coordinates?.lng;

  return (
    <>
      <PageHeader title={c.title} subtitle={`Complaint #${shortId(c)} · ${categoryLabel(c.category)} · ${formatDate(c.createdAt)}`} action={<StatusBadge status={c.status} />} />
      <div className="grid2">
        <section className="card detail">
          <h2>Details</h2>
          <dl>
            <dt>Reported by</dt><dd>{c.user?.name || c.user?.email || '—'}</dd>
            <dt>Description</dt><dd>{c.description}</dd>
            <dt>Area</dt><dd>{c.location || '—'}</dd>
            <dt>Address</dt><dd>{c.address || '—'}</dd>
            {lat && lng && (<><dt>Map</dt><dd><a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`} target="_blank" rel="noreferrer">Open {lat}, {lng} in OpenStreetMap</a></dd></>)}
          </dl>
          {c.imageUrl || c.image ? <img className="photo" src={imageUrl(c.imageUrl || c.image)} alt={`Photo for ${c.title}`} /> : <p className="muted">No photo was attached.</p>}
        </section>
        <div>
          <section className="card">
            <h2>Assign</h2>
            <form onSubmit={assign}>
              <Field id="assignee" label="Assigned to" hint="Staff member or collection team.">
                <input id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
              </Field>
              <button className="btn" disabled={busy}>Assign complaint</button>
            </form>
          </section>
          <section className="card">
            <h2>Update status</h2>
            <Field id="status" label="Status">
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <button className="btn" disabled={busy || status === c.status} onClick={() => save({ status }, 'Status updated.')}>{busy ? 'Saving…' : 'Update status'}</button>
          </section>
          <section className="card"><h2>Progress</h2><Timeline status={c.status} history={c.history} /></section>
        </div>
      </div>
      <Link to="/admin/complaints">← Back to all complaints</Link>
    </>
  );
}
