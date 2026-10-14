import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsApi, errorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { CATEGORIES, cid, unwrap } from '../utils.js';
import { Field, PageHeader } from '../components/ui.jsx';

const MAX_MB = 5;

export default function ReportWaste() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '', address: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [coords, setCoords] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return setFile(null);
    if (!f.type.startsWith('image/')) return setErrors((x) => ({ ...x, photo: 'Choose an image file (JPG, PNG or WebP).' }));
    if (f.size > MAX_MB * 1024 * 1024) return setErrors((x) => ({ ...x, photo: `Image must be smaller than ${MAX_MB} MB.` }));
    setErrors((x) => ({ ...x, photo: undefined }));
    setFile(f);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error('Your browser does not support location lookup.');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const c = { lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) };
        setCoords(c);
        setForm((f) => ({ ...f, location: `${c.lat}, ${c.lng}` }));
      },
      () => toast.error('Could not get your location. Type the area instead.')
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.title.trim().length < 5) errs.title = 'Enter a short title (at least 5 characters).';
    if (form.description.trim().length < 10) errs.description = 'Describe the problem (at least 10 characters).';
    if (!form.category) errs.category = 'Choose a category.';
    if (!form.location.trim()) errs.location = 'Enter the area or landmark.';
    if (!form.address.trim()) errs.address = 'Enter the street address.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v.trim()));
    if (coords) { body.append('latitude', coords.lat); body.append('longitude', coords.lng); }
    if (file) body.append('image', file);

    setBusy(true);
    try {
      const res = await complaintsApi.create(body);
      toast.success('Complaint submitted. We’ll keep you updated.');
      const created = unwrap(res, 'complaint');
      navigate(cid(created) ? `/complaints/${cid(created)}` : '/complaints');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally { setBusy(false); }
  };

  const aria = (k) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-err` : undefined });

  return (
    <>
      <PageHeader title="Report a waste problem" subtitle="The more precise the location, the faster it gets fixed." />
      <form className="card form-grid" onSubmit={submit} noValidate>
        <Field id="title" label="Title" error={errors.title}><input id="title" value={form.title} onChange={set('title')} {...aria('title')} /></Field>
        <Field id="category" label="Category" error={errors.category}>
          <select id="category" value={form.category} onChange={set('category')} {...aria('category')}>
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <div className="span2"><Field id="description" label="Description" error={errors.description}>
          <textarea id="description" rows="4" value={form.description} onChange={set('description')} {...aria('description')} />
        </Field></div>
        <Field id="location" label="Area or landmark" error={errors.location} hint="Or use your current position.">
          <input id="location" value={form.location} onChange={set('location')} {...aria('location')} />
        </Field>
        <Field id="address" label="Street address" error={errors.address}><input id="address" value={form.address} onChange={set('address')} {...aria('address')} /></Field>
        <div className="span2"><button type="button" className="btn btn-ghost" onClick={useMyLocation}>Use my current location</button></div>
        <div className="span2"><Field id="photo" label="Photograph (optional)" error={errors.photo} hint={`JPG, PNG or WebP, up to ${MAX_MB} MB.`}>
          <input id="photo" type="file" accept="image/*" onChange={onFile} {...aria('photo')} />
        </Field>
        {preview && <img className="photo small" src={preview} alt="Selected upload preview" />}</div>
        <div className="span2"><button className="btn btn-lg" disabled={busy}>{busy ? 'Submitting…' : 'Submit complaint'}</button></div>
      </form>
    </>
  );
}
