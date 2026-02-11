import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DemoUser, Role, getUsers, setUsers, addAuditLog, getDevices, setDevices, getOTPs, setOTPs, initDemoData, Device } from '@/lib/demo-data';
import { runZeroTrustCheck, PolicyResult, getDeviceFingerprint, detectOS, detectBrowser, fetchRealIP, getCachedIP, getSimulatedPosture, RealIPInfo } from '@/lib/zero-trust';

interface AuthState {
  user: DemoUser | null;
  isAuthenticated: boolean;
  pendingOTP: { userId: string; type: 'registration' | 'login' } | null;
  lastPolicyResult: PolicyResult | null;
  currentDevice: Device | null;
  ipInfo: RealIPInfo | null;
}

interface AuthContextType extends AuthState {
  register: (data: { fullName: string; email: string; mobile: string; password: string }) => { success: boolean; error?: string; otp?: string };
  login: (email: string, password: string) => { success: boolean; error?: string; otp?: string; requiresOTP: boolean };
  verifyOTP: (code: string) => { success: boolean; error?: string };
  resendOTP: () => { success: boolean; otp?: string };
  logout: () => void;
  hasRole: (requiredRoles: Role[]) => boolean;
  getAllUsers: () => DemoUser[];
  addUser: (data: { fullName: string; email: string; mobile: string; password: string; role: Role }) => { success: boolean; error?: string };
  updateUser: (userId: string, data: Partial<Pick<DemoUser, 'fullName' | 'email' | 'mobile' | 'role' | 'status'>>) => void;
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
    ipInfo: null,
  });

  useEffect(() => {
    initDemoData();
    // Fetch real IP on mount
    fetchRealIP().then(info => {
      setState(s => ({ ...s, ipInfo: info }));
    });
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

  const getIP = useCallback(() => state.ipInfo || getCachedIP(), [state.ipInfo]);

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

    const ip = getIP();
    addAuditLog({ userId: newUser.id, userEmail: newUser.email, action: 'REGISTER', details: 'New user registration', ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    addAuditLog({ userId: newUser.id, userEmail: newUser.email, action: 'OTP_SENT', details: `Registration OTP sent: ${otp}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });

    setState(s => ({ ...s, pendingOTP: { userId: newUser.id, type: 'registration' } }));
    console.log(`📧 OTP for ${data.email}: ${otp}`);
    return { success: true, otp };
  }, [generateOTP, getIP]);

  const login = useCallback((email: string, password: string) => {
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return { success: false, error: 'Invalid credentials', requiresOTP: false };
    if (user.password !== password) {
      const ip = getIP();
      addAuditLog({ userId: user.id, userEmail: user.email, action: 'LOGIN_FAIL', details: 'Invalid password', ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'failure' });
      return { success: false, error: 'Invalid credentials', requiresOTP: false };
    }
    if (user.status === 'disabled') return { success: false, error: 'Account disabled', requiresOTP: false };
    if (user.status === 'pending_verification') return { success: false, error: 'Account not verified', requiresOTP: false };

    const otp = generateOTP();
    const otps = getOTPs();
    otps.push({ userId: user.id, code: otp, expiresAt: Date.now() + 5 * 60 * 1000, type: 'login', attempts: 0 });
    setOTPs(otps);

    const ip = getIP();
    addAuditLog({ userId: user.id, userEmail: user.email, action: 'OTP_SENT', details: `Login OTP sent: ${otp}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });

    setState(s => ({ ...s, pendingOTP: { userId: user.id, type: 'login' } }));
    console.log(`📧 OTP for ${email}: ${otp}`);
    return { success: true, requiresOTP: true, otp };
  }, [generateOTP, getIP]);

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
      const ip = getIP();
      addAuditLog({ userId: otp.userId, userEmail: '', action: 'OTP_FAIL', details: 'Invalid OTP entered', ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'failure' });
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

    // Zero trust check with REAL IP
    const ip = getIP();
    const policy = runZeroTrustCheck(ip, 0, device.approved, device.posture);

    addAuditLog({ userId: user.id, userEmail: user.email, action: 'OTP_VERIFIED', details: 'OTP verified successfully', ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success', riskScore: policy.riskScore });
    addAuditLog({ userId: user.id, userEmail: user.email, action: 'POLICY_DECISION', details: `Decision: ${policy.decision} | Risk: ${policy.riskScore} | Reasons: ${policy.reasons.join(', ') || 'None'}`, ip: ip.ip, location: `${policy.signals.city}, ${policy.signals.country}`, outcome: policy.decision === 'block' ? 'blocked' : 'success', riskScore: policy.riskScore });
    addAuditLog({ userId: user.id, userEmail: user.email, action: 'LOGIN_SUCCESS', details: `Login from ${device.browser} on ${device.os}`, ip: ip.ip, location: `${policy.signals.city}, ${policy.signals.country}`, outcome: 'success', riskScore: policy.riskScore });

    localStorage.setItem('zt_session', JSON.stringify({ userId: user.id, lastPolicy: policy }));
    setState(s => ({ ...s, user, isAuthenticated: true, pendingOTP: null, lastPolicyResult: policy, currentDevice: device }));
    return { success: true };
  }, [state.pendingOTP, getIP]);

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
      const ip = getIP();
      addAuditLog({ userId: state.user.id, userEmail: state.user.email, action: 'LOGOUT', details: 'User logged out', ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    }
    localStorage.removeItem('zt_session');
    setState(s => ({ ...s, user: null, isAuthenticated: false, pendingOTP: null, lastPolicyResult: null, currentDevice: null }));
  }, [state.user, getIP]);

  const hasRole = useCallback((requiredRoles: Role[]) => {
    if (!state.user) return false;
    if (state.user.role === 'SUPERADMIN') return true;
    return requiredRoles.includes(state.user.role);
  }, [state.user]);

  const getAllUsers = useCallback(() => getUsers(), []);

  const addUser = useCallback((data: { fullName: string; email: string; mobile: string; password: string; role: Role }) => {
    const users = getUsers();
    if (users.find(u => u.email === data.email)) return { success: false, error: 'Email already exists' };
    const newUser: DemoUser = {
      id: 'u_' + Date.now(),
      fullName: data.fullName,
      email: data.email,
      mobile: data.mobile,
      password: data.password,
      role: data.role,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setUsers(users);
    const ip = getIP();
    addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'USER_CREATED', details: `SuperAdmin created user: ${data.email} with role ${data.role}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    return { success: true };
  }, [state.user, getIP]);

  const updateUser = useCallback((userId: string, data: Partial<Pick<DemoUser, 'fullName' | 'email' | 'mobile' | 'role' | 'status'>>) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, data);
      setUsers(users);
      const ip = getIP();
      addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'USER_UPDATED', details: `SuperAdmin updated user: ${user.email}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    }
  }, [state.user, getIP]);
  
  const updateUserRole = useCallback((userId: string, role: Role) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.role = role;
      setUsers(users);
      const ip = getIP();
      addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'ROLE_CHANGED', details: `Role changed for ${user.email} to ${role}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    }
  }, [state.user, getIP]);

  const toggleUserStatus = useCallback((userId: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.status = user.status === 'active' ? 'disabled' : 'active';
      setUsers(users);
      const ip = getIP();
      addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'USER_STATUS_CHANGED', details: `User ${user.email} ${user.status}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    }
  }, [state.user, getIP]);

  const deleteUser = useCallback((userId: string) => {
    const users = getUsers();
    const target = users.find(u => u.id === userId);
    const filtered = users.filter(u => u.id !== userId);
    setUsers(filtered);
    const ip = getIP();
    addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'USER_DELETED', details: `SuperAdmin deleted user: ${target?.email || userId}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
  }, [state.user, getIP]);

  const approveDevice = useCallback((deviceId: string) => {
    const devices = getDevices();
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      device.approved = true;
      device.approvedBy = state.user?.id;
      setDevices(devices);
      const ip = getIP();
      addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'DEVICE_APPROVED', details: `Device ${deviceId} approved`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    }
  }, [state.user, getIP]);

  const denyDevice = useCallback((deviceId: string) => {
    const devices = getDevices().filter(d => d.id !== deviceId);
    setDevices(devices);
    const ip = getIP();
    addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'DEVICE_DENIED', details: `Device ${deviceId} denied and removed`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
  }, [state.user, getIP]);

  const getAllDevices = useCallback(() => getDevices(), []);

  const requestDeviceApproval = useCallback(() => {
    if (!state.user || !state.currentDevice) return;
    const ip = getIP();
    addAuditLog({ userId: state.user.id, userEmail: state.user.email, action: 'DEVICE_APPROVAL_REQUEST', details: `Device approval requested: ${state.currentDevice.browser} on ${state.currentDevice.os}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
  }, [state.user, state.currentDevice, getIP]);

  return (
    <AuthContext.Provider value={{
      ...state, register, login, verifyOTP, resendOTP, logout, hasRole,
      getAllUsers, addUser, updateUser, updateUserRole, toggleUserStatus, deleteUser,
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
