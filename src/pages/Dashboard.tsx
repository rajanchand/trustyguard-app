import { motion } from 'framer-motion';
import { Shield, Monitor, MapPin, Clock, Cpu, Globe, Wifi } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RiskScoreGauge from '@/components/RiskScoreGauge';
import ZeroTrustWorkflow from '@/components/ZeroTrustWorkflow';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, currentDevice, lastPolicyResult, requestDeviceApproval, ipInfo } = useAuth();
  if (!user) return null;

  const decisionColor = lastPolicyResult?.decision === 'allow' ? 'text-success' : lastPolicyResult?.decision === 'step_up_mfa' ? 'text-warning' : 'text-destructive';
  const decisionBg = lastPolicyResult?.decision === 'allow' ? 'bg-success/10 border-success/30' : lastPolicyResult?.decision === 'step_up_mfa' ? 'bg-warning/10 border-warning/30' : 'bg-destructive/10 border-destructive/30';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user.fullName}</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {user.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{user.fullName}</h3>
                <p className="text-xs font-mono text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-mono text-accent">{user.role}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-mono text-success">{user.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Member since</span><span className="font-mono text-foreground">{new Date(user.createdAt).toLocaleDateString()}</span></div>
            </div>
          </motion.div>

          {/* Risk Score */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-lg border border-border bg-card p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Risk Score</h3>
            <RiskScoreGauge score={lastPolicyResult?.riskScore ?? 0} />
          </motion.div>

          {/* Access Status */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Access Status</h3>
            {lastPolicyResult && (
              <div className={`rounded-md border p-4 ${decisionBg}`}>
                <div className={`text-lg font-bold font-mono uppercase ${decisionColor}`}>
                  {lastPolicyResult.decision.replace('_', ' ')}
                </div>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{lastPolicyResult.signals.city}, {lastPolicyResult.signals.region}, {lastPolicyResult.signals.country}</div>
                  <div className="flex items-center gap-2"><Monitor className="h-3 w-3" />{lastPolicyResult.signals.browser} / {lastPolicyResult.signals.os}</div>
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" />{new Date(lastPolicyResult.signals.loginTime).toLocaleString()}</div>
                  <div className="flex items-center gap-2"><Shield className="h-3 w-3" />IP: {lastPolicyResult.signals.ip}</div>
                  <div className="flex items-center gap-2"><Wifi className="h-3 w-3" />ISP: {lastPolicyResult.signals.isp}</div>
                  <div className="flex items-center gap-2"><Globe className="h-3 w-3" />TZ: {lastPolicyResult.signals.timezone} | Lat: {lastPolicyResult.signals.lat?.toFixed(2)}, Lon: {lastPolicyResult.signals.lon?.toFixed(2)}</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Real IP Info */}
        {ipInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-6 rounded-lg border border-primary/20 bg-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Your Real Location (Live)
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="flex justify-between sm:flex-col"><span className="text-muted-foreground">IP Address</span><span className="font-mono text-primary">{ipInfo.ip}</span></div>
              <div className="flex justify-between sm:flex-col"><span className="text-muted-foreground">Location</span><span className="font-mono text-foreground">{ipInfo.city}, {ipInfo.region}, {ipInfo.country}</span></div>
              <div className="flex justify-between sm:flex-col"><span className="text-muted-foreground">ISP</span><span className="font-mono text-foreground">{ipInfo.isp}</span></div>
              <div className="flex justify-between sm:flex-col"><span className="text-muted-foreground">Timezone</span><span className="font-mono text-foreground">{ipInfo.timezone}</span></div>
            </div>
          </motion.div>
        )}

        {/* Zero Trust Workflow */}
        <div className="mt-6">
          <ZeroTrustWorkflow result={lastPolicyResult} />
        </div>

        {/* Device Info */}
        {currentDevice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Device Info
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Browser</span><span className="font-mono text-foreground">{currentDevice.browser}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">OS</span><span className="font-mono text-foreground">{currentDevice.os}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fingerprint</span><span className="font-mono text-primary text-xs">{currentDevice.fingerprint}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved</span>
                  <span className={`font-mono ${currentDevice.approved ? 'text-success' : 'text-destructive'}`}>
                    {currentDevice.approved ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-muted-foreground text-xs uppercase">Device Posture</h4>
                {Object.entries(currentDevice.posture).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}</span>
                    <span className={`font-mono ${val ? 'text-success' : 'text-destructive'}`}>{val ? '✓' : '✗'}</span>
                  </div>
                ))}
              </div>
            </div>
            {!currentDevice.approved && (
              <Button variant="outline" className="mt-4" onClick={requestDeviceApproval}>Request Device Approval</Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
