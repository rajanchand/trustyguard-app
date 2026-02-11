import { Device } from './demo-data';

export interface SignalData {
  ip: string;
  country: string;
  city: string;
  userAgent: string;
  os: string;
  browser: string;
  loginTime: string;
  failedAttempts: number;
  deviceApproved: boolean;
  posture: {
    hasUpdatedOS: boolean;
    hasAV: boolean;
    diskEncrypted: boolean;
    screenLockEnabled: boolean;
  };
}

export type PolicyDecision = 'allow' | 'step_up_mfa' | 'block';

export interface PolicyResult {
  decision: PolicyDecision;
  riskScore: number;
  reasons: string[];
  signals: SignalData;
}

const SIMULATED_IPS = [
  { ip: '192.168.1.100', country: 'United States', city: 'New York' },
  { ip: '10.0.0.55', country: 'United States', city: 'San Francisco' },
  { ip: '203.0.113.42', country: 'Germany', city: 'Berlin' },
  { ip: '198.51.100.7', country: 'Russia', city: 'Moscow' },
];

export function getSimulatedIP() {
  return SIMULATED_IPS[Math.floor(Math.random() * SIMULATED_IPS.length)];
}

export function getDeviceFingerprint(): string {
  let fp = localStorage.getItem('zt_device_fp');
  if (!fp) {
    fp = 'dev_' + Math.random().toString(36).slice(2, 12);
    localStorage.setItem('zt_device_fp', fp);
  }
  return fp;
}

export function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
  return 'Unknown';
}

export function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return 'Unknown';
}

export function getSimulatedPosture(): Device['posture'] {
  return {
    hasUpdatedOS: Math.random() > 0.2,
    hasAV: Math.random() > 0.15,
    diskEncrypted: Math.random() > 0.3,
    screenLockEnabled: Math.random() > 0.1,
  };
}

export function collectSignals(failedAttempts: number, deviceApproved: boolean, posture?: Device['posture']): SignalData {
  const ipInfo = getSimulatedIP();
  const p = posture || getSimulatedPosture();
  return {
    ip: ipInfo.ip,
    country: ipInfo.country,
    city: ipInfo.city,
    userAgent: navigator.userAgent,
    os: detectOS(),
    browser: detectBrowser(),
    loginTime: new Date().toISOString(),
    failedAttempts,
    deviceApproved,
    posture: p,
  };
}

export function computeRiskScore(signals: SignalData): number {
  let score = 0;

  // High-risk countries
  if (['Russia', 'China', 'North Korea'].includes(signals.country)) score += 30;
  
  // Failed attempts
  score += Math.min(signals.failedAttempts * 10, 30);

  // Device not approved
  if (!signals.deviceApproved) score += 15;

  // Device posture
  if (!signals.posture.hasUpdatedOS) score += 8;
  if (!signals.posture.hasAV) score += 10;
  if (!signals.posture.diskEncrypted) score += 7;
  if (!signals.posture.screenLockEnabled) score += 5;

  // Off-hours login (before 6am or after 10pm)
  const hour = new Date(signals.loginTime).getHours();
  if (hour < 6 || hour > 22) score += 10;

  return Math.min(score, 100);
}

export function evaluatePolicy(riskScore: number): PolicyResult['decision'] {
  if (riskScore <= 30) return 'allow';
  if (riskScore <= 60) return 'step_up_mfa';
  return 'block';
}

export function runZeroTrustCheck(failedAttempts: number, deviceApproved: boolean, posture?: Device['posture']): PolicyResult {
  const signals = collectSignals(failedAttempts, deviceApproved, posture);
  const riskScore = computeRiskScore(signals);
  const decision = evaluatePolicy(riskScore);
  
  const reasons: string[] = [];
  if (riskScore > 60) reasons.push('Risk score exceeds threshold');
  if (!signals.deviceApproved) reasons.push('Device not approved');
  if (signals.failedAttempts > 2) reasons.push('Multiple failed login attempts');
  if (!signals.posture.hasAV) reasons.push('No antivirus detected');
  if (!signals.posture.diskEncrypted) reasons.push('Disk not encrypted');
  if (['Russia', 'China', 'North Korea'].includes(signals.country)) reasons.push('High-risk location');

  return { decision, riskScore, reasons, signals };
}
