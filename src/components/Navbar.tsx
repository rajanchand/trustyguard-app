import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, LogOut, LayoutDashboard, Users, ShieldCheck, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['USER', 'ADMIN', 'SUPERADMIN', 'IT'] as const },
    { to: '/admin', label: 'Admin', icon: Users, roles: ['ADMIN', 'SUPERADMIN'] as const },
    { to: '/superadmin', label: 'Super Admin', icon: ShieldCheck, roles: ['SUPERADMIN'] as const },
    { to: '/it', label: 'IT Security', icon: Monitor, roles: ['IT', 'SUPERADMIN'] as const },
  ];

  return (
    <nav className="border-b border-border glass sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-gradient">Zero Trust</span>
        </Link>

        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1">
            {navItems.filter(item => hasRole([...item.roles])).map(item => (
              <Link key={item.to} to={item.to}>
                <Button
                  variant={location.pathname === item.to ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <div className="hidden sm:flex flex-col items-end text-sm">
                <span className="font-medium text-foreground">{user.fullName}</span>
                <span className="text-xs text-muted-foreground font-mono">{user.role}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/register"><Button size="sm">Sign Up</Button></Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
