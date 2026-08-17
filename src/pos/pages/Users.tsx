import { useState } from "react";
import { Plus, Pencil, Trash2, KeyRound, Save, UserCog, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "../store";
import { Page, Card, Btn, IconBtn, Modal, Field, Inp, Sel, Tag, TableX } from "../ui";
import { User, ROLE_LABEL, Role, Perm, ALL_PERMS, DEFAULT_PERMS, todayISO } from "../core";

const ROLE_DESC: Record<Role, string> = {
  admin: "Full access — users, settings, database, everything.",
  manager: "Sales, purchases, inventory, accounts and reports. Permissions configurable by an administrator.",
  cashier: "POS, sales, returns and receipts only.",
  inventory: "Products, purchases, inventory and stock operations.",
};

export function Users() {
  const { db, user, saveUser, deleteUser, resetPassword, confirm, adminGate } = usePos();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [pwFor, setPwFor] = useState<User | null>(null);
  const [newPw, setNewPw] = useState("");

  return (
    <Page title="Users & Permissions" subtitle="Create users, assign roles and permissions, reset passwords, enable or disable accounts."
      actions={<Btn icon={<Plus className="size-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>New User</Btn>} wide>
      <Card pad={false}>
        <TableX
          cols={[
            { key: "username", label: "Username", sort: (u: User) => u.username, render: (u: User) => <span className="font-mono text-sm font-semibold">{u.username}</span> },
            { key: "name", label: "Name", render: (u: User) => u.name },
            { key: "role", label: "Role", render: (u: User) => <Tag tone={u.role === "admin" ? "red" : u.role === "manager" ? "violet" : u.role === "cashier" ? "blue" : "orange"}>{ROLE_LABEL[u.role]}</Tag> },
            { key: "status", label: "Status", render: (u: User) => (u.active ? <Tag tone="green">Active</Tag> : <Tag tone="slate">Disabled</Tag>) },
            { key: "pw", label: "Password", render: (u: User) => (u.mustChange ? <Tag tone="amber">Must change</Tag> : <Tag tone="green">Set</Tag>) },
            { key: "act", label: "", align: "right" as const, render: (u: User) => (
              <div className="flex justify-end gap-1">
                <IconBtn icon={<KeyRound className="size-4" />} label="Reset password" tone="primary" onClick={async () => {
                  if (u.id === user?.id) { toast.error("Use your profile to change your own password."); return; }
                  if (await adminGate("Reset password", `Confirm with your administrator password to reset the password for "${u.username}".`))
                    { setPwFor(u); setNewPw(""); }
                }} />
                <IconBtn icon={<Pencil className="size-4" />} label="Edit" onClick={() => { setEditing(u); setFormOpen(true); }} />
                <IconBtn icon={<Trash2 className="size-4" />} label="Delete" tone="danger" onClick={async () => {
                  if (u.id === user?.id) { toast.error("You cannot delete your own account."); return; }
                  const ok = await adminGate("Delete user", `Confirm with your administrator password to delete "${u.username}".`);
                  if (!ok) return;
                  const ok2 = await confirm(`Delete user "${u.username}"?`, "The account will be permanently removed.", true);
                  if (ok2) { const e = deleteUser(u.id); if (e) toast.error(e); }
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

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        {(Object.keys(ROLE_DESC) as Role[]).map((r) => (
          <div key={r} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <ShieldCheck className="size-4 text-emerald-500" /> {ROLE_LABEL[r]}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{ROLE_DESC[r]}</p>
          </div>
        ))}
      </div>

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
            <Inp type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 6 characters" autoFocus />
          </Field>
          <p className="mt-2 text-[11px] text-slate-400">Passwords are never displayed. The user will sign in with the new password on their next login.</p>
        </Modal>
      )}
    </Page>
  );
}

function UserForm({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { saveUser } = usePos();
  const isNew = !user;
  const [f, setF] = useState<User>(user || {
    id: "", username: "", name: "", password: "", role: "cashier", perms: [...DEFAULT_PERMS.cashier], active: true, mustChange: false, createdAt: todayISO(),
  });
  const set = (patch: Partial<User>) => setF({ ...f, ...patch });

  const changeRole = (role: Role) => {
    const perms = role === "admin" ? [...ALL_PERMS] : [...DEFAULT_PERMS[role]];
    set({ role, perms });
  };

  const togglePerm = (perm: Perm) => {
    if (f.role === "admin") return;
    const has = f.perms.includes(perm);
    set({ perms: has ? f.perms.filter((p) => p !== perm) : [...f.perms, perm] });
  };

  return (
    <Modal open onClose={onClose} title={isNew ? "New User" : `Edit User — ${user?.username}`} subtitle="Roles control module access; manager and inventory permissions are configurable." size="md"
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
            <Sel value={f.role} onChange={(e) => changeRole(e.target.value as Role)}>
              <option value="admin">Administrator — full access</option>
              <option value="manager">Manager — configurable permissions</option>
              <option value="cashier">Cashier — POS, sales, returns, receipts</option>
              <option value="inventory">Inventory Staff — products, purchases, stock</option>
            </Sel>
          </Field>
          <Field label="Password" required={isNew}>
            <Inp type="password" value={f.password} onChange={(e) => set({ password: e.target.value })} placeholder={isNew ? "Set initial password" : "Leave blank to keep current"} />
          </Field>
        </div>

        {f.role !== "admin" && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Permissions</div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-3">
              {ALL_PERMS.map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={f.perms.includes(perm)} onChange={() => togglePerm(perm)} className="size-3.5 accent-indigo-600" />
                  {perm}
                </label>
              ))}
            </div>
          </div>
        )}

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
