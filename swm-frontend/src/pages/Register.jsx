import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../services/api.js';
import { Field } from '../components/ui.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your full name.';
    if (!EMAIL.test(form.email)) errs.email = 'Enter a valid email address.';
    if (form.password.length < 8) errs.password = 'Use at least 8 characters.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const data = await register({ ...form, name: form.name.trim() });
      if (data.token) {
        toast.success('Account created. Welcome!');
        navigate('/dashboard', { replace: true });
      } else {
        toast.success('Account created. Please sign in.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally { setBusy(false); }
  };

  return (
    <form className="card auth" onSubmit={submit} noValidate>
      <h1>Create your account</h1>
      {errors.form && <div className="alert" role="alert">{errors.form}</div>}
      {[['name', 'Full name', 'text', 'name'], ['email', 'Email', 'email', 'email'], ['password', 'Password', 'password', 'new-password']].map(([k, label, type, ac]) => (
        <Field key={k} id={k} label={label} error={errors[k]} hint={k === 'password' ? 'At least 8 characters.' : undefined}>
          <input id={k} type={type} autoComplete={ac} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-err` : k === 'password' ? 'password-hint' : undefined} />
        </Field>
      ))}
      <button className="btn btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      <p className="muted">Already registered? <Link to="/login">Sign in</Link></p>
    </form>
  );
}
