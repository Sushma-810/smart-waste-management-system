import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PublicLayout() {
  const { user } = useAuth();
  return (
    <>
      <header className="topnav">
        <Link to="/" className="brand">EcoReport</Link>
        <nav aria-label="Main">
          {user ? (
            <Link className="btn" to={user.role === 'admin' ? '/admin' : '/dashboard'}>Open dashboard</Link>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <Link className="btn" to="/register">Create account</Link>
            </>
          )}
        </nav>
      </header>
      <main><Outlet /></main>
      <footer className="footer">Smart Waste Management System · Report it. Track it. Get it cleaned.</footer>
    </>
  );
}
