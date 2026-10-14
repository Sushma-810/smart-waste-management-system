import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../services/api.js';
import { Field } from '../components/ui.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!EMAIL.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name}.`);
      navigate(location.state?.from || (user.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally { setBusy(false); }
  };

  return (
    <form className="card auth" onSubmit={submit} noValidate>
      <h1>Sign in</h1>
      {errors.form && <div className="alert" role="alert">{errors.form}</div>}
      <Field id="email" label="Email" error={errors.email}>
        <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-err' : undefined} />
      </Field>
      <Field id="password" label="Password" error={errors.password}>
        <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-err' : undefined} />
      </Field>
      <button className="btn btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </form>
  );
}
