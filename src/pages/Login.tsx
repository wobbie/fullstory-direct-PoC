import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppState';

export function Login() {
  const { login } = useAppState();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [plan, setPlan] = useState('free');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    login(username.trim(), plan);
    navigate('/account');
  };

  return (
    <section>
      <h1>Log in</h1>
      <p className="muted">Fake login: any username works. Passwords are excluded from capture by FullStory automatically.</p>
      <form onSubmit={submit} className="form">
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" />
        </label>
        <label>
          Plan
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </label>
        <button type="submit">Log in</button>
      </form>
    </section>
  );
}

export function Account() {
  const { user, logout } = useAppState();
  const navigate = useNavigate();
  if (!user) return <p>You are not logged in.</p>;
  return (
    <section>
      <h1>Account</h1>
      <table className="kv">
        <tbody>
          <tr><th>User ID (sent to FullStory as uid)</th><td><code>{user.id}</code></td></tr>
          <tr><th>Display name</th><td>{user.displayName}</td></tr>
          <tr><th>Plan</th><td>{user.plan}</td></tr>
        </tbody>
      </table>
      <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
    </section>
  );
}
