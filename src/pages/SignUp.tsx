import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signup(name, email, password);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-secondary/5">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground-strong mb-2">Account Created!</h2>
            <p className="text-muted-foreground mb-6">Welcome to ChronoLens. Redirecting...</p>
            <div className="animate-pulse text-sm text-muted-foreground">
              You'll be redirected shortly
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-secondary/5">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold mx-auto mb-3">
            CL
          </div>
          <h1 className="text-3xl font-bold text-foreground-strong mb-2">Join ChronoLens</h1>
          <p className="text-muted-foreground">Create your account to get started</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Features */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3">Get access to:</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>✓ Policy search and retrieval</li>
              <li>✓ AI-powered analysis</li>
              <li>✓ Role-based access levels</li>
            </ul>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
