import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Fingerprint, ArrowRight, CheckCircle2, Monitor, Database, Wifi, BarChart3, FileText, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

const principles = [
  { icon: Eye, title: 'Verify Explicitly', desc: 'Always authenticate and authorize based on all available data points — identity, location, device health, workload, and data classification.' },
  { icon: Lock, title: 'Least Privilege Access', desc: 'Limit user access with just-in-time and just-enough-access (JIT/JEA) policies. Role-based access enforced at every layer.' },
  { icon: Fingerprint, title: 'Assume Breach', desc: 'Minimize blast radius and segment access. Verify end-to-end encryption, use analytics to detect threats and log everything.' },
];

const pillars = [
  { icon: UserCheck, label: 'Identity', desc: 'MFA + OTP verification' },
  { icon: Monitor, label: 'Devices', desc: 'Trust & posture checks' },
  { icon: Shield, label: 'Applications', desc: 'RBAC protected routes' },
  { icon: Database, label: 'Data', desc: 'Encrypted & access-controlled' },
  { icon: Wifi, label: 'Network', desc: 'IP & ISP risk analysis' },
  { icon: BarChart3, label: 'Analytics', desc: 'Real-time risk scoring' },
  { icon: FileText, label: 'Audit', desc: 'Comprehensive logging' },
];

const workflowSteps = [
  { num: '01', title: 'Request Access', desc: 'User submits credentials', color: 'border-primary/40' },
  { num: '02', title: 'Verify Identity', desc: 'Password + MFA/OTP check', color: 'border-primary/40' },
  { num: '03', title: 'Verify Device', desc: 'Fingerprint, posture, trust', color: 'border-accent/40' },
  { num: '04', title: 'Collect Signals', desc: 'IP, location, ISP, time', color: 'border-accent/40' },
  { num: '05', title: 'Risk Score', desc: 'Compute 0–100 risk level', color: 'border-warning/40' },
  { num: '06', title: 'Policy Decision', desc: 'Allow / Step-Up / Block', color: 'border-warning/40' },
  { num: '07', title: 'Enforce', desc: 'Grant or deny access', color: 'border-success/40' },
  { num: '08', title: 'Audit Log', desc: 'Record everything', color: 'border-muted-foreground/40' },
];

const features = [
  'Multi-factor authentication with email/SMS OTP',
  'Role-based access control (USER, ADMIN, IT, SUPERADMIN)',
  'Real-time risk scoring engine (0–100)',
  'Device trust & posture verification',
  'Account lockout after 5 failed attempts',
  'Rate limiting on login & OTP',
  'Comprehensive audit logging',
  'Policy-driven access decisions',
  'Real IP geolocation detection',
  'Access Denied page with detailed reasons',
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background grid-bg">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 md:pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono text-primary">Microsoft Zero Trust Framework</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6">
              <span className="text-foreground">Never Trust.</span><br />
              <span className="text-gradient">Always Verify.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              A complete Zero Trust security implementation with identity verification,
              device trust, risk-based policy decisions, role-based access control, and audit logging.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gap-2 gradient-primary border-0 text-primary-foreground px-8 h-12 text-base font-semibold">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="gap-2 h-12 text-base border-border">Sign In</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Zero Trust Workflow */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-foreground mb-3">Zero Trust Workflow</h2>
        <p className="text-sm text-muted-foreground text-center mb-10 max-w-lg mx-auto">Every access request passes through this verification pipeline before being granted or denied.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {workflowSteps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className={`rounded-lg border-2 ${step.color} bg-card p-4 relative`}
            >
              <div className="text-xs font-mono text-muted-foreground mb-1">STEP {step.num}</div>
              <div className="text-sm font-bold text-foreground">{step.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{step.desc}</div>
              {i < workflowSteps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">→</div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-foreground mb-8">Core Principles</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {principles.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15 }}
              className="rounded-lg border border-border bg-card p-6 hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <p.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Microsoft Pillars */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-foreground mb-3">Zero Trust Pillars</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">Based on Microsoft's Zero Trust architecture model</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 max-w-5xl mx-auto">
          {pillars.map((p, i) => (
            <motion.div key={p.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.06 }}
              className="rounded-lg border border-border bg-card p-4 text-center hover:border-primary/30 transition-colors">
              <p.icon className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-xs font-bold text-foreground">{p.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-foreground mb-8">Security Features</h2>
        <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
          {features.map((f, i) => (
            <motion.div key={f} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span className="text-sm text-foreground">{f}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo accounts */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">Demo Accounts</h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-3 text-sm font-semibold text-muted-foreground p-3 border-b border-border bg-secondary/30">
              <span>Email</span><span>Password</span><span>Role</span>
            </div>
            {[
              ['superadmin@demo.com', 'Admin@1234', 'SUPERADMIN'],
              ['admin@demo.com', 'Admin@1234', 'ADMIN'],
              ['it@demo.com', 'Admin@1234', 'IT'],
              ['user@demo.com', 'Admin@1234', 'USER'],
            ].map(([email, pwd, role]) => (
              <div key={email} className="grid grid-cols-3 text-sm p-3 border-b border-border last:border-0">
                <span className="font-mono text-primary text-xs">{email}</span>
                <span className="font-mono text-foreground text-xs">{pwd}</span>
                <span className="font-mono text-accent text-xs">{role}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">OTP codes are logged to the browser console (F12)</p>
        </div>
      </section>

      {/* Architecture */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">Architecture</h2>
          <div className="rounded-lg border border-border bg-card p-6 font-mono text-xs text-muted-foreground overflow-x-auto">
            <pre className="whitespace-pre">{`
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   Browser    │────▶│  React App   │────▶│  Auth Context   │
│  (Client)    │     │  (Vite+TS)   │     │  (JWT Session)  │
└─────────────┘     └──────────────┘     └────────────────┘
                           │                      │
                    ┌──────┴──────┐         ┌─────┴──────┐
                    │             │         │            │
               ┌────▼────┐  ┌────▼────┐  ┌─▼──────────┐│
               │ Identity │  │ Device  │  │   Policy    ││
               │  Verify  │  │  Trust  │  │   Engine    ││
               │ (OTP/MFA)│  │(Posture)│  │(Risk Score) ││
               └────┬─────┘  └────┬────┘  └─────┬──────┘│
                    │             │              │       │
                    └──────┬──────┘         ┌────┴───┐   │
                           │                │ RBAC   │   │
                    ┌──────▼──────┐         │ Guard  │   │
                    │  IP Geoloc  │         └────┬───┘   │
                    │  (ip-api)   │              │       │
                    └─────────────┘         ┌────▼───────▼┐
                                            │  Audit Log  │
                                            │ (All Events)│
                                            └─────────────┘
            `}</pre>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Zero Trust Security Demo — React + Vite + Tailwind CSS
      </footer>
    </div>
  );
}
