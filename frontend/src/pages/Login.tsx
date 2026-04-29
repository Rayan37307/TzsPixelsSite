import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '../components/ui/Base';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-6">
             <div className="w-8 h-8 rounded-full border-4 border-black" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Scalefy account</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 mt-4 text-lg">Sign In</Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account? <a href="#" className="text-primary font-semibold hover:underline">Sign up for free</a>
        </p>
      </div>
    </div>
  );
};
