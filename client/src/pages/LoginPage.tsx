import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import type { User } from "../types";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

/**
 * Mock auth: pick a seeded account (or type its email). Intentionally simple so
 * reviewers can switch between owner/collaborator quickly to test sharing.
 */


export default function LoginPage() {
  const { login } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.listUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  async function signIn(address: string) {
    setError(null);
    setBusy(true);
    try {
      await login(address.trim());
      navigate("/", {replace: true})
      
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setError("Enter an email address.");
    void signIn(email);
  }

  return (
    <main className="login">
      <section className="login__card">
        <div className="login__logo">A</div>
        <h1>Ajaia Docs</h1>
        <p className="login__sub">Write, share and collaborate on documents.</p>

        {users.length > 0 && (
          <div className="login__demo">
            <p className="login__label">Demo accounts</p>
            <ul>
              {users.map((u) => (
                <li key={u.id}>
                  <button className="login__user" disabled={busy} onClick={() => signIn(u.email)}>
                    <span className="login__avatar">{u.name.charAt(0)}</span>
                    <span>
                      <strong>{u.name}</strong>
                      <small>{u.email}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={onSubmit} className="login__form">
          <label htmlFor="email" className="login__label">Or sign in with email</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <button className="btn btn--primary login__submit" disabled={busy} type="submit">
            {busy ? "Signing in…" : "Continue"}
          </button>
          {error && <p className="error-text" role="alert">{error}</p>}
        </form>
      </section>
    </main>
  );
}
