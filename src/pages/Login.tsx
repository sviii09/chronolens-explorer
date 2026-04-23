import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { SocialLogin } from '@/components/SocialLogin';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const isEmailValid = email.includes('@') && email.includes('.');
  const isFormValid = email.trim() !== '' && password.trim() !== '' && isEmailValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTouched({ email: true, password: true });

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isEmailValid) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  // Load remembered email on mount
  useState(() => {
    const remembered = localStorage.getItem('rememberEmail');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  });

  const handleGoogleLogin = () => {
    // In production, this would initiate Google OAuth flow
    // For now, use demo credentials
    setEmail('demo@example.com');
    setPassword('password123');
    setError('Demo: Use form below to login with demo credentials');
  };

  const handleOutlookLogin = () => {
    // In production, this would initiate Outlook OAuth flow
    setEmail('demo@example.com');
    setPassword('password123');
    setError('Demo: Use form below to login with demo credentials');
  };

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-lg font-bold mx-auto mb-4 shadow-lg">
            CL
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground text-base">Access your government policy insights instantly</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-2xl p-8 mb-6 backdrop-blur-sm bg-opacity-95">
          {/* Social Login */}
          <SocialLogin
            isLoading={isLoading}
            onGoogleClick={handleGoogleLogin}
            onOutlookClick={handleOutlookLogin}
          />

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-foreground mb-2 block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  className={`pl-11 h-11 rounded-lg transition-all ${
                    touched.email && email && isEmailValid
                      ? 'border-accent bg-accent/5'
                      : touched.email && email && !isEmailValid
                      ? 'border-destructive bg-destructive/5'
                      : ''
                  }`}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {touched.email && email && !isEmailValid && (
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                  <span>Please enter a valid email address</span>
                </p>
              )}
              {touched.email && email && isEmailValid && (
                <p className="text-xs text-accent mt-1.5">✓ Email looks good</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  className="pl-11 pr-11 h-11 rounded-lg transition-all"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-card cursor-pointer accent-primary"
                disabled={isLoading}
              />
              <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                Remember me for 30 days
              </Label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-base font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-7 pt-6 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Try Demo Account:</p>
            <div className="space-y-2 text-xs font-mono bg-secondary/30 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="text-primary font-semibold">demo@example.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Password:</span>
                <span className="text-primary font-semibold">password123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-primary/90 underline font-semibold transition-colors">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
