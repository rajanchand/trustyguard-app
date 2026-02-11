import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DemoUser, Role, getUsers, setUsers, addAuditLog, getDevices, setDevices, getOTPs, setOTPs, initDemoData, Device, OTPRecord } from '@/lib/demo-data';
import { runZeroTrustCheck, PolicyResult, getDeviceFingerprint, detectOS, detectBrowser, getSimulatedIP, getSimulatedPosture } from '@/lib/zero-trust';

interface AuthState {
  user: DemoUser | null;
  isAuthenticated: boolean;
  pendingOTP: { userId: string; type: 'registration' | 'login' } | null;
  lastPolicyResult: PolicyResult | null;
  currentDevice: Device | null;
}

interface AuthContextType extends AuthState {
  register: (data: { fullName: string; email: string; mobile: string; password: string }) => { success: boolean; error?: string; otp?: string };
  login: (email: string, password: string) => { success: boolean; error?: string; otp?: string; requiresOTP: boolean };
  verifyOTP: (code: string) => { success: boolean; error?: string };
  resendOTP: () => { success: boolean; otp?: string };
  logout: () => void;
  hasRole: (requiredRoles: Role[]) => boolean;
  getAllUsers: () => DemoUser[];
  updateUserRole: (userId: string, role: Role) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  approveDevice: (deviceId: string) => void;
  denyDevice: (deviceId: string) => void;
  getAllDevices: () => Device[];
  requestDeviceApproval: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    pendingOTP: null,
    lastPolicyResult: null,
    currentDevice: null,
  });

  useEffect(() => {
    initDemoData();
    const saved = localStorage.getItem('zt_session');
    if (saved) {
      const session = JSON.parse(saved);
      const users = getUsers();
      const user = users.find(u => u.id === session.userId);
      if (user && user.status === 'active') {
        const fp = getDeviceFingerprint();
        const devices = getDevices();
        const device = devices.find(d => d.userId === user.id && d.fingerprint === fp);
        setState(s => ({ ...s, user, isAuthenticated: true, currentDevice: device || null, lastPolicyResult: session.lastPolicy || null }));
      }
    }
  }, []);

  const generateOTP = useCallback((): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }, []);

  const register = useCallback((data: { fullName: string; email: string; mobile: string; password: string }) => {
    const users = getUsers();
    if (users.find(u => u.email === data.email)) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser: DemoUser = {
      id: 'u_' + Date.now(),
      fullName: data.fullName,
      email: data.email,
      mobile: data.mobile,
      password: data.password,
      role: 'USER',
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setUsers(users);

    const otp = generateOTP();
    const otps = getOTPs();
    otps.push({ userId: newUser.id, code: otp, expiresAt: Date.now() + 5 * 60 * 1000, type: 'registration', attempts: 0 });
    setOTPs(otps);

    const ipInfo = getSimulatedIP();
    addAuditLog({ userId: newUser.id, userEmail: newUser.email, action: 'REGISTER', details: 'New user registration', ip: ipInfo.ip, location: `${ipInfo.city}, ${ipInfo.country}`, outcome: 'success' });
    addAuditLog({ userId: newUser.id, userEmail: newUser.email, action: 'OTP_SENT', details: `Registration OTP sent: ${otp}`, ip: ipInfo.ip, location: `${ipInfo.city}, ${ipInfo.country}`, outcome: 'success' });

    setState(s => ({ ...s, pendingOTP: { userId: newUser.id, type: 'registration' } }));
    console.log(`📧 OTP for ${data.email}: ${otp}`);
    return { success: true, otp };
  }, [generateOTP]);

  const login = useCallback((email: string, password: string) => {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return { success: false, error: 'Invalid credentials', requiresOTP: false };
    if (user.password !== password) {
      const ipInfo = getSimulatedIP();
      addAuditLog({ userId: user.id, userEmail: user.email, action: 'LOGIN_FAIL', details: 'Invalid password', ip: ipInfo.ip, location: `${ipInfo.city}, ${ipInfo.country}`, outcome: 'failure' });
      return { success: false, error: 'Invalid credentials', requiresOTP: false };
    }
    if (user.status === 'disabled') return { success: false, error: 'Account disabled', requiresOTP: false };
    if (user.status === 'pending_verification') return { success: false, error: 'Account not verified', requiresOTP: false };

    const otp = generateOTP();
    const otps = getOTPs();
    otps.push({ userId: user.id, code: otp, expiresAt: Date.now() + 5 * 60 * 1000, type: 'login', attempts: 0 });
    setOTPs(otps);

    const ipInfo = getSimulatedIP();
    addAuditLog({ userId: user.id, userEmail: user.email, action: 'OTP_SENT', details: `Login OTP sent: ${otp}`, ip: ipInfo.ip, location: `${ipInfo.city}, ${ipInfo.country}`, outcome: 'success' });

    setState(s => ({ ...s, pendingOTP: { userId: user.id, type: 'login' } }));
    console.log(`📧 OTP for ${email}: ${otp}`);
    return { success: true, requiresOTP: true, otp };
  }, [generateOTP]);

  const verifyOTP = useCallback((code: string) => {
    if (!state.pendingOTP) return { success: false, error: 'No pending OTP' };
    const otps = getOTPs();
    const idx = otps.findIndex(o => o.userId === state.pendingOTP!.userId && o.type === state.pendingOTP!.type);
    if (idx === -1) return { success: false, error: 'OTP expired' };
    const otp = otps[idx];
    
    if (otp.attempts >= 5) {
      otps.splice(idx, 1);
      setOTPs(otps);
      return { success: false, error: 'Too many attempts. Request a new OTP.' };
    }
    if (Date.now() > otp.expiresAt) {
      otps.splice(idx, 1);
      setOTPs(otps);
      return { success: false, error: 'OTP expired' };
    }
    if (otp.code !== code) {
      otp.attempts++;
      setOTPs(otps);
      const ipInfo = getSimulatedIP();
      addAuditLog({ userId: otp.userId, userEmail: '', action: 'OTP_FAIL', details: 'Invalid OTP entered', ip: ipInfo.ip, location: `${ipInfo.city}, ${ipInfo.country}`, outcome: 'failure' });
      return { success: false, error: 'Invalid OTP' };
    }

    otps.splice(idx, 1);
    setOTPs(otps);

    const users = getUsers();
    const user = users.find(u => u.id === state.pendingOTP!.userId);
    if (!user) return { success: false, error: 'User not found' };

    if (state.pendingOTP.type === 'registration') {
      user.status = 'active';
      setUsers(users);
    }

    // Device handling
    const fp = getDeviceFingerprint();
    const devices = getDevices();
    let device = devices.find(d => d.userId === user.id && d.fingerprint === fp);
    if (!device) {
      device = {
        id: 'dev_' + Date.now(),
        userId: user.id,
        userAgent: navigator.userAgent,
        os: detectOS(),
        browser: detectBrowser(),
        fingerprint: fp,
        approved: false,
        requestedAt: new Date().toISOString(),
        posture: getSimulatedPosture(),
      };
      devices.push(device);
      setDevices(devices);
    }

    // Zero trust check
    const failedAttempts = 0;
    const policy = runZeroTrustCheck(failedAttempts, device.approved, device.posture);

    const ipInfo = getSimulatedIP();
    addAuditLog({ userId: user.id, userEmail: user.email, action: 'OTP_VERIFIED', details: 'OTP verified successfully', ip: ipInfo.ip, location: `${ipInfo.city}, ${ipInfo.country}`, outcome: 'success', riskScore: policy.riskScore });
    addAuditLog({ userId: user.id, userEmail: user.email, action: 'POLICY_DECISION', details: `Decision: ${policy.decision} | Risk: ${policy.riskScore} | Reasons: ${policy.reasons.join(', ') || 'None'}`, ip: policy.signals.ip, location: `${policy.signals.city}, ${policy.signals.country}`, outcome: policy.decision === 'block' ? 'blocked' : 'success', riskScore: policy.riskScore });
    addAuditLog({ userId: user.id, userEmail: user.email, action: 'LOGIN_SUCCESS', details: `Login from ${device.browser} on ${device.os}`, ip: policy.signals.ip, location: `${policy.signals.city}, ${policy.signals.country}`, outcome: 'success', riskScore: policy.riskScore });

    localStorage.setItem('zt_session', JSON.stringify({ userId: user.id, lastPolicy: policy }));
    setState({ user, isAuthenticated: true, pendingOTP: null, lastPolicyResult: policy, currentDevice: device });
    return { success: true };
  }, [state.pendingOTP]);

  const resendOTP = useCallback(() => {
    if (!state.pendingOTP) return { success: false };
    const otps = getOTPs();
    const filtered = otps.filter(o => !(o.userId === state.pendingOTP!.userId && o.type === state.pendingOTP!.type));
    const otp = generateOTP();
    filtered.push({ userId: state.pendingOTP.userId, code: otp, expiresAt: Date.now() + 5 * 60 * 1000, type: state.pendingOTP.type, attempts: 0 });
    setOTPs(filtered);
    console.log(`📧 Resent OTP: ${otp}`);
    return { success: true, otp };
  }, [state.pendingOTP, generateOTP]);

  const logout = useCallback(() => {
    if (state.user) {
      const ipInfo = getSimulatedIP();
      addAuditLog({ userId: state.user.id, userEmail: state.user.email, action: 'LOGOUT', details: 'User logged out', ip: ipInfo.ip, location: `${ipInfo.city}, ${ipInfo.country}`, outcome: 'success' });
    }
    localStorage.removeItem('zt_session');
    setState({ user: null, isAuthenticated: false, pendingOTP: null, lastPolicyResult: null, currentDevice: null });
  }, [state.user]);

  const hasRole = useCallback((requiredRoles: Role[]) => {
    if (!state.user) return false;
    if (state.user.role === 'SUPERADMIN') return true;
    return requiredRoles.includes(state.user.role);
  }, [state.user]);

  const getAllUsers = useCallback(() => getUsers(), []);
  
  const updateUserRole = useCallback((userId: string, role: Role) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.role = role;
      setUsers(users);
    }
  }, []);

  const toggleUserStatus = useCallback((userId: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.status = user.status === 'active' ? 'disabled' : 'active';
      setUsers(users);
    }
  }, []);

  const deleteUser = useCallback((userId: string) => {
    const users = getUsers().filter(u => u.id !== userId);
    setUsers(users);
  }, []);

  const approveDevice = useCallback((deviceId: string) => {
    const devices = getDevices();
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      device.approved = true;
      device.approvedBy = state.user?.id;
      setDevices(devices);
    }
  }, [state.user]);

  const denyDevice = useCallback((deviceId: string) => {
    const devices = getDevices().filter(d => d.id !== deviceId);
    setDevices(devices);
  }, []);

  const getAllDevices = useCallback(() => getDevices(), []);

  const requestDeviceApproval = useCallback(() => {
    if (!state.user || !state.currentDevice) return;
    const ipInfo = getSimulatedIP();
    addAuditLog({ userId: state.user.id, userEmail: state.user.email, action: 'DEVICE_APPROVAL_REQUEST', details: `Device approval requested: ${state.currentDevice.browser} on ${state.currentDevice.os}`, ip: ipInfo.ip, location: `${ipInfo.city}, ${ipInfo.country}`, outcome: 'success' });
  }, [state.user, state.currentDevice]);

  return (
    <AuthContext.Provider value={{
      ...state, register, login, verifyOTP, resendOTP, logout, hasRole,
      getAllUsers, updateUserRole, toggleUserStatus, deleteUser,
      approveDevice, denyDevice, getAllDevices, requestDeviceApproval,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
