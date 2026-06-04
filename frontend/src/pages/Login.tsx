import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Button } from '../components/ui/Base';
import { ShieldCheck, Zap, KeyRound } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { token });
      localStorage.setItem('auth_token', res.data.token);
      navigate('/');
    } catch {
      setError('Invalid access token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-xl bg-card border-2 border-border mx-auto flex items-center justify-center mb-6">
            <Zap className="w-8 h-8 text-[var(--color-accent)]" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Sign in</h1>
          <p className="font-mono text-sm text-muted-foreground mt-2">Enter your access token</p>
        </div>

        <Card className="p-10 relative">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <KeyRound className="w-3 h-3" /> Access Token
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full h-12 bg-card border-2 border-border rounded-lg px-4 text-sm text-foreground focus:outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-muted-foreground"
                required
                autoFocus
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-[var(--color-danger)]">{error}</p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2 gap-2" disabled={loading}>
              {loading ? 'Verifying...' : 'Sign in'} <Zap className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-4 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-[var(--color-success)]" /> AES-256
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[var(--color-accent)]" /> Low latency
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
