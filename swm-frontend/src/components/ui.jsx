import { Link } from 'react-router-dom';
import { statusLabel } from '../utils.js';

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="center-box" role="status"><span className="spinner" /><span>{label}</span></div>
);

export const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>{statusLabel(status)}</span>
);

export const EmptyState = ({ title, text, action }) => (
  <div className="empty">
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {action && <Link className="btn" to={action.to}>{action.label}</Link>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="empty" role="alert">
    <h3>We couldn’t load this</h3>
    <p>{message}</p>
    {onRetry && <button className="btn btn-ghost" onClick={onRetry}>Try again</button>}
  </div>
);

export const StatCard = ({ label, value, tone = '' }) => (
  <div className={`card stat ${tone}`}>
    <p className="stat-label">{label}</p>
    <p className="stat-value">{value ?? '—'}</p>
  </div>
);

export const Field = ({ id, label, error, children, hint }) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    {children}
    {hint && !error && <small id={`${id}-hint`}>{hint}</small>}
    {error && <small id={`${id}-err`} className="field-error" role="alert">{error}</small>}
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="page-head">
    <div><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div>
    {action}
  </div>
);
