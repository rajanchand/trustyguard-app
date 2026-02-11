import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Fingerprint, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

const principles = [
  { icon: Eye, title: 'Verify Explicitly', desc: 'Always authenticate and authorize based on all available data points.' },
  { icon: Lock, title: 'Least Privilege', desc: 'Limit user access with just-in-time and just-enough-access policies.' },
  { icon: Fingerprint, title: 'Assume Breach', desc: 'Minimize blast radius and segment access. Verify end-to-end encryption.' },
];

const features = [
  'Multi-factor authentication with OTP',
  'Role-based access control (RBAC)',
  'Real-time risk scoring engine',
  'Device trust & posture verification',
  'Comprehensive audit logging',
  'Policy-driven access decisions',
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background grid-bg">
      <Navbar />
      
      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono text-primary">Microsoft Zero Trust Framework</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              <span className="text-foreground">Never Trust.</span>
              <br />
              <span className="text-gradient">Always Verify.</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Experience a realistic Zero Trust security workflow with identity verification, 
              risk-based policy decisions, device trust, and comprehensive audit logging.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gap-2 gradient-primary border-0 text-primary-foreground px-8 h-12 text-base font-semibold">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="gap-2 h-12 text-base border-border">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Principles */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {principles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="rounded-lg border border-border bg-card p-6 hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <p.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">Demo Features</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {features.map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-md bg-secondary/50"
              >
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span className="text-sm text-foreground">{f}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo accounts */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">Demo Accounts</h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-3 gap-0 text-sm font-semibold text-muted-foreground p-3 border-b border-border bg-secondary/30">
              <span>Email</span><span>Password</span><span>Role</span>
            </div>
            {[
              ['superadmin@demo.com', 'Admin@1234', 'SUPERADMIN'],
              ['admin@demo.com', 'Admin@1234', 'ADMIN'],
              ['it@demo.com', 'Admin@1234', 'IT'],
              ['user@demo.com', 'Admin@1234', 'USER'],
            ].map(([email, pwd, role]) => (
              <div key={email} className="grid grid-cols-3 gap-0 text-sm p-3 border-b border-border last:border-0">
                <span className="font-mono text-primary">{email}</span>
                <span className="font-mono text-foreground">{pwd}</span>
                <span className="font-mono text-accent">{role}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">OTP codes are logged to the browser console (F12)</p>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Zero Trust Security Demo — Built with React + Vite + Tailwind
      </footer>
    </div>
  );
}
