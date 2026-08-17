import { useState } from "react";
import { Plus, Pencil, Trash2, KeyRound, Save, UserCog } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "../store";
import { Page, Card, Btn, IconBtn, Modal, Field, Inp, Sel, Tag, TableX } from "../ui";
import { User, ROLE_LABEL, Role, todayISO } from "../core";

export function Users() {
  const { db, user, saveUser, deleteUser, resetPassword, confirm } = usePos();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [pwFor, setPwFor] = useState<User | null>(null);
  const [newPw, setNewPw] = useState("");

  return (
    <Page title="Users & Permissions" subtitle="Create users, assign roles, reset passwords, enable or disable accounts."
      actions={<Btn icon={<Plus className="size-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>New User</Btn>} wide>
      <Card pad={false}>
        <TableX
          cols={[
            { key: "username", label: "Username", sort: (u: User) => u.username, render: (u: User) => <span className="font-mono text-sm font-semibold">{u.username}</span> },
            { key: "name", label: "Name", render: (u: User) => u.name },
            { key: "role", label: "Role", render: (u: User) => <Tag tone={u.role === "admin" ? "red" : u.role === "manager" ? "violet" : "blue"}>{ROLE_LABEL[u.role]}</Tag> },
            { key: "status", label: "Status", render: (u: User) => (u.active ? <Tag tone="green">Active</Tag> : <Tag tone="slate">Disabled</Tag>) },
            { key: "pw", label: "Password", render: (u: User) => (u.mustChange ? <Tag tone="amber">Must change</Tag> : <Tag tone="green">Set</Tag>) },
            { key: "act", label: "", align: "right" as const, render: (u: User) => (
              <div className="flex justify-end gap-1">
                <IconBtn icon={<KeyRound className="size-4" />} label="Reset password" tone="primary" onClick={() => { setPwFor(u); setNewPw(""); }} />
                <IconBtn icon={<Pencil className="size-4" />} label="Edit" onClick={() => { setEditing(u); setFormOpen(true); }} />
                <IconBtn icon={<Trash2 className="size-4" />} label="Delete" tone="danger" onClick={async () => {
                  if (u.id === user?.id) { toast.error("You cannot delete your own account."); return; }
                  const ok = await confirm(`Delete user "${u.username}"?`, "", true);
                  if (ok) { const e = deleteUser(u.id); if (e) toast.error(e); }
                }} />
              </div>
            ) },
          ]}
          rows={db.users}
          rowKey={(u) => u.id}
          pageSize={12}
          empty="No users."
        />
      </Card>

      {formOpen && <UserForm user={editing} onClose={() => setFormOpen(false)} />}

      {pwFor && (
        <Modal open onClose={() => setPwFor(null)} title={`Reset Password — ${pwFor.username}`} size="sm"
          footer={
            <>
              <Btn variant="outline" onClick={() => setPwFor(null)}>Cancel</Btn>
              <Btn icon={<KeyRound className="size-4" />} onClick={() => {
                const e = resetPassword(pwFor.id, newPw);
                if (e) toast.error(e);
                else setPwFor(null);
              }}>Reset Password</Btn>
            </>
          }>
          <Field label="New Password" required>
            <Inp type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 6 characters" autoFocus />
          </Field>
        </Modal>
      )}
    </Page>
  );
}

function UserForm({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { saveUser } = usePos();
  const isNew = !user;
  const [f, setF] = useState<User>(user || {
    id: "", username: "", name: "", password: "", role: "cashier", active: true, mustChange: false, createdAt: todayISO(),
  });
  const set = (patch: Partial<User>) => setF({ ...f, ...patch });
  return (
    <Modal open onClose={onClose} title={isNew ? "New User" : `Edit User — ${user?.username}`} subtitle="Roles control which modules each user can access." size="md"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn icon={<Save className="size-4" />} onClick={() => {
            if (!f.username.trim() || !f.name.trim()) { toast.error("Username and name are required."); return; }
            if (isNew && f.password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
            saveUser(f, isNew);
            onClose();
          }}>{isNew ? "Create User" : "Update User"}</Btn>
        </>
      }>
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Username" required><Inp value={f.username} onChange={(e) => set({ username: e.target.value })} /></Field>
        <Field label="Full Name" required><Inp value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Role" required>
          <Sel value={f.role} onChange={(e) => set({ role: e.target.value as Role })}>
            <option value="admin">Administrator — full access</option>
            <option value="manager">Manager — sales, purchases, inventory, reports</option>
            <option value="cashier">Cashier — POS, sales, returns, receipts</option>
          </Sel>
        </Field>
        <Field label="Password" required={isNew}>
          <Inp value={f.password} onChange={(e) => set({ password: e.target.value })} placeholder={isNew ? "Set initial password" : "Leave blank to keep current"} />
        </Field>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} className="size-4 accent-indigo-600" />
          Account active
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={f.mustChange} onChange={(e) => set({ mustChange: e.target.checked })} className="size-4 accent-indigo-600" />
          Force password change on next login
        </label>
      </div>
      {!isNew && !f.password && <p className="text-xs text-slate-400">Leave the password field empty to keep the current password.</p>}
    </div>
    </Modal>
  );
}

export function RoleBadge() {
  const { user } = usePos();
  if (!user) return null;
  return <UserCog className="size-4" />;
}
