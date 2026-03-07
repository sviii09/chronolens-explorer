import { useState } from 'react';
import { User, Mail, Shield, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to access settings</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-foreground-strong mb-8">Account Settings</h1>

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground-strong flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </h2>
            <Button
              variant={isEditing ? 'default' : 'outline'}
              onClick={() => setIsEditing(!isEditing)}
              disabled
            >
              {isEditing ? 'Saving...' : 'Edit'}
            </Button>
          </div>

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {user.name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profile Picture</p>
                <p className="text-xs text-muted-foreground mt-1">Gravatar integration coming soon</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label className="text-sm font-medium">Full Name</Label>
              <Input
                type="text"
                value={user.name}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                type="email"
                value={user.email}
                disabled
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Role & Permissions */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground-strong flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5" />
            Access & Permissions
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground-strong">User Role</p>
                <p className="text-xs text-muted-foreground mt-1">Current access level</p>
              </div>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                {user.role.replace('_', ' ')}
              </span>
            </div>

            <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
              <p className="text-sm font-medium text-foreground-strong mb-2">Your Access Level</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 3 search results per query</li>
                <li>✓ Basic analysis features</li>
                <li>✓ Standard support</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Contact admin to upgrade your role
              </p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground-strong mb-6">Preferences</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground-strong">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Get updates about new schemes</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground-strong">Research Digest</p>
                <p className="text-xs text-muted-foreground">Weekly policy news and updates</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded"
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h2>

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            You can always sign back in anytime with your credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
