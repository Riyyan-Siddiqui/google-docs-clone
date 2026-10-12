import type { ReactNode } from "react";
import { useAuth } from "../auth";
import "./AppHeader.css";
import {Link} from 'react-router-dom';

export default function AppHeader({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <header className="app-header">
      <Link to="/" className="app-header__brand" aria-label="Back to all documents">
        <span className="app-header__logo">A</span>
        <span className="app-header__name">Ajaia Docs</span>
      </Link>
      <div className="app-header__center">{children}</div>
      <div className="app-header__user">
        {user && (
          <>
            <span className="app-header__avatar" aria-hidden>{user.name.charAt(0).toUpperCase()}</span>
            <span className="app-header__who">{user.name}</span>
            <button className="btn btn--ghost" onClick={logout}>Sign out</button>
          </>
        )}
      </div>
    </header>
  );
}
