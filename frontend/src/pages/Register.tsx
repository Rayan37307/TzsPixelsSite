import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, Button } from '../components/ui/Base';
import { useAuthStore } from '../store/useAuthStore';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ username, email, password });
      navigate('/login');
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-6">
             <div className="w-8 h-8 rounded-full border-4 border-black" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-muted-foreground">Start your journey with Scalefy</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe" 
                  className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 mt-4 text-lg" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
