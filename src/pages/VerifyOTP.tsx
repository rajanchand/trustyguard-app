import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(300);
  const [loading, setLoading] = useState(false);
  const { pendingOTP, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!pendingOTP) { navigate('/login'); return; }
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [pendingOTP, navigate]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const result = verifyOTP(otp);
      setLoading(false);
      if (!result.success) {
        toast({ title: 'Verification Failed', description: result.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Verified!', description: 'Access granted' });
      navigate('/dashboard');
    }, 500);
  };

  const handleResend = () => {
    const result = resendOTP();
    if (result.success) {
      setCountdown(300);
      toast({ title: 'OTP Resent', description: `Check console (F12): ${result.otp}` });
    }
  };

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
        <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">OTP Verification</h1>
        <p className="text-sm text-muted-foreground mb-6">Enter the 6-digit code sent to your email & mobile</p>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-[0.5em] font-mono h-14"
              required
            />
            <div className="text-sm font-mono text-muted-foreground">
              {countdown > 0 ? `Expires in ${mins}:${secs.toString().padStart(2, '0')}` : 'OTP Expired'}
            </div>
            <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading || countdown === 0}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </form>
          <Button variant="ghost" className="mt-3 text-primary" onClick={handleResend}>Resend OTP</Button>
          <p className="text-xs text-muted-foreground mt-4">💡 OTP is logged to browser console (F12)</p>
        </div>
      </motion.div>
    </div>
  );
}
