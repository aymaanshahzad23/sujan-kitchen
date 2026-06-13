import { useState, type FormEvent } from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onLogin();
  }

  return (
    <div className="login-page">
      <div className="login-page__brand">
        <h1 className="login-page__logo">SUJÁN</h1>
        <p className="login-page__title">Kitchen Dashboard</p>
      </div>

      <form className="login-page__bar" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          aria-label="Email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          aria-label="Password"
        />
        <button type="submit" className="login-page__submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
