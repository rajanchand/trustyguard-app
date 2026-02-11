import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { getAuditLogs, AuditLog } from '@/lib/demo-data';

export default function ITDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => { setLogs(getAuditLogs()); }, []);

  const filtered = logs.filter(l =>
    !filter || l.action.toLowerCase().includes(filter.toLowerCase()) ||
    l.userEmail.toLowerCase().includes(filter.toLowerCase()) ||
    l.outcome.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.outcome === 'success').length,
    failures: logs.filter(l => l.outcome === 'failure').length,
    blocked: logs.filter(l => l.outcome === 'blocked').length,
    avgRisk: logs.filter(l => l.riskScore !== undefined).reduce((a, l) => a + (l.riskScore || 0), 0) / (logs.filter(l => l.riskScore !== undefined).length || 1),
  };

  const statCards = [
    { label: 'Total Events', value: stats.total, icon: Shield, color: 'text-primary' },
    { label: 'Successful', value: stats.success, icon: CheckCircle, color: 'text-success' },
    { label: 'Failed', value: stats.failures, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Blocked', value: stats.blocked, icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Monitor className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">IT Security Dashboard</h1>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-3xl font-bold font-mono text-foreground mt-2">{s.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Average Risk Score:</span>
            <span className="text-lg font-bold font-mono text-foreground">{Math.round(stats.avgRisk)}/100</span>
          </div>
        </div>

        <div className="mb-4">
          <Input placeholder="Filter by action, user, or outcome..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/30 text-muted-foreground">
              <th className="p-3 text-left">Time</th><th className="p-3 text-left">User</th><th className="p-3 text-left">Action</th><th className="p-3 text-left">Details</th><th className="p-3 text-left">Risk</th><th className="p-3 text-left">Outcome</th><th className="p-3 text-left">IP</th><th className="p-3 text-left">Location</th>
            </tr></thead>
            <tbody>
              {filtered.slice(0, 100).map(l => (
                <tr key={l.id} className="border-b border-border last:border-0 text-xs">
                  <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="p-3 text-primary font-mono">{l.userEmail || '—'}</td>
                  <td className="p-3 text-foreground font-semibold">{l.action}</td>
                  <td className="p-3 text-muted-foreground max-w-[200px] truncate">{l.details}</td>
                  <td className="p-3 font-mono">{l.riskScore ?? '—'}</td>
                  <td className="p-3"><span className={`font-mono ${l.outcome === 'success' ? 'text-success' : l.outcome === 'blocked' ? 'text-destructive' : 'text-warning'}`}>{l.outcome}</span></td>
                  <td className="p-3 font-mono text-muted-foreground">{l.ip}</td>
                  <td className="p-3 text-muted-foreground">{l.location}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No logs found</td></tr>}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
