import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { DemoUser, Role } from '@/lib/demo-data';
import { useToast } from '@/hooks/use-toast';

export default function SuperAdmin() {
  const { getAllUsers, updateUserRole, toggleUserStatus, deleteUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<DemoUser[]>([]);

  const refresh = () => setUsers(getAllUsers());
  useEffect(refresh, [getAllUsers]);

  const handleDelete = (id: string) => { deleteUser(id); refresh(); toast({ title: 'User Deleted' }); };
  const handleRole = (id: string, r: string) => { updateUserRole(id, r as Role); refresh(); toast({ title: 'Role Updated' }); };
  const handleToggle = (id: string) => { toggleUserStatus(id); refresh(); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Super Admin</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Full system access: create, disable, delete users, change any role.</p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/30 text-muted-foreground">
              <th className="p-3 text-left">Name</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Role</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground">{u.fullName}</td>
                  <td className="p-3 font-mono text-primary text-xs">{u.email}</td>
                  <td className="p-3">
                    <Select value={u.role} onValueChange={v => handleRole(u.id, v)}>
                      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{['USER','ADMIN','IT','SUPERADMIN'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="p-3"><span className={`font-mono text-xs ${u.status === 'active' ? 'text-success' : 'text-destructive'}`}>{u.status}</span></td>
                  <td className="p-3 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(u.id)}>
                      {u.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
