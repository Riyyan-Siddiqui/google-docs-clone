import type { Doc, DocSummary, Role, Share, User } from "./types";
import { ApiError, getStoredUser } from "./api-session";

/** In-memory backend used for UI previews (VITE_MOCK=1). Not shipped in the real build. */

const users: User[] = [
  { id: "u1", name: "Alex Rivera", email: "alex@example.com" },
  { id: "u2", name: "Sam Okafor", email: "sam@example.com" },
  { id: "u3", name: "Priya Nair", email: "priya@example.com" },
];

interface Rec { id: string; title: string; content: string; ownerId: string; updatedAt: string; shares: Record<string, Share["role"]> }

const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

const docs: Rec[] = [
  {
    id: "d1", title: "Q4 Product Roadmap", ownerId: "u1", updatedAt: ago(2), shares: { u2: "editor" },
    content: "<h1>Q4 Product Roadmap</h1><p>This quarter we focus on <strong>collaboration</strong> and <em>reliability</em>.</p><h2>Goals</h2><ul><li>Ship real-time sharing</li><li>Cut save latency by <u>half</u></li><li>Launch file import</li></ul><h2>Milestones</h2><ol><li>Design review</li><li>Beta</li><li>General availability</li></ol>",
  },
  { id: "d2", title: "Meeting notes – Oct 8", ownerId: "u1", updatedAt: ago(30), shares: {}, content: "<p>Attendees: Alex, Sam, Priya.</p><h3>Decisions</h3><ul><li>Use SQLite for the first version</li></ul>" },
  { id: "d3", title: "Brand voice guidelines", ownerId: "u2", updatedAt: ago(5), shares: { u1: "viewer" }, content: "<h1>Brand voice</h1><p>Clear, warm, and <strong>direct</strong>.</p>" },
  { id: "d4", title: "Onboarding checklist", ownerId: "u3", updatedAt: ago(50), shares: { u1: "editor" }, content: "<h2>Week 1</h2><ol><li>Laptop setup</li><li>Meet the team</li></ol>" },
];

const delay = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));

function me(): User {
  const u = getStoredUser();
  const found = u && users.find((x) => x.id === u.id);
  if (!found) throw new ApiError(401, "Not signed in");
  return found;
}

function roleOf(d: Rec, uid: string): Role | null {
  if (d.ownerId === uid) return "owner";
  return d.shares[uid] ?? null;
}

function summary(d: Rec, uid: string): DocSummary {
  const role = roleOf(d, uid);
  if (!role) throw new ApiError(403, "No access");
  return { id: d.id, title: d.title, updatedAt: d.updatedAt, role, ownerName: users.find((u) => u.id === d.ownerId)!.name };
}

function find(id: string, uid: string): Rec {
  const d = docs.find((x) => x.id === id);
  if (!d) throw new ApiError(404, "Document not found");
  if (!roleOf(d, uid)) throw new ApiError(403, "No access");
  return d;
}

const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

export const mockApi = {
  listUsers: () => delay(users),
  login: async (email: string) => {
    const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) throw new ApiError(404, "No account with that email. Try a demo account.");
    return delay(u);
  },
  listDocs: async () => { const u = me(); return delay(docs.filter((d) => roleOf(d, u.id)).map((d) => summary(d, u.id))); },
  getDoc: async (id: string): Promise<Doc> => { const u = me(); const d = find(id, u.id); return delay({ ...summary(d, u.id), content: d.content }); },
  createDoc: async (title = "Untitled document"): Promise<Doc> => {
    const u = me();
    const d: Rec = { id: `d${Date.now()}`, title, content: "", ownerId: u.id, updatedAt: new Date().toISOString(), shares: {} };
    docs.push(d);
    return delay({ ...summary(d, u.id), content: "" });
  },
  updateDoc: async (id: string, patch: { title?: string; content?: string }): Promise<Doc> => {
    const u = me(); const d = find(id, u.id);
    if (roleOf(d, u.id) === "viewer") throw new ApiError(403, "You have view-only access.");
    if (patch.title !== undefined) d.title = patch.title;
    if (patch.content !== undefined) d.content = patch.content;
    d.updatedAt = new Date().toISOString();
    return delay({ ...summary(d, u.id), content: d.content }, 60);
  },
  deleteDoc: async (id: string) => {
    const u = me(); const d = find(id, u.id);
    if (d.ownerId !== u.id) throw new ApiError(403, "Only the owner can delete.");
    docs.splice(docs.indexOf(d), 1);
    return delay(undefined as void);
  },
  importFile: async (file: File): Promise<Doc> => {
    const u = me();
    const text = await file.text();
    const html = text.split(/\n{2,}/).map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
    const d: Rec = { id: `d${Date.now()}`, title: file.name.replace(/\.[^.]+$/, ""), content: html, ownerId: u.id, updatedAt: new Date().toISOString(), shares: {} };
    docs.push(d);
    return delay({ ...summary(d, u.id), content: html });
  },
  listShares: async (id: string): Promise<Share[]> => {
    const u = me(); const d = find(id, u.id);
    return delay(Object.entries(d.shares).map(([uid, role]) => { const x = users.find((y) => y.id === uid)!; return { userId: uid, name: x.name, email: x.email, role }; }));
  },
  addShare: async (id: string, email: string, role: Share["role"]): Promise<Share> => {
    const u = me(); const d = find(id, u.id);
    if (d.ownerId !== u.id) throw new ApiError(403, "Only the owner can share.");
    const target = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!target) throw new ApiError(404, "No user with that email.");
    if (target.id === u.id) throw new ApiError(400, "You already own this document.");
    d.shares[target.id] = role;
    return delay({ userId: target.id, name: target.name, email: target.email, role });
  },
  removeShare: async (id: string, userId: string) => {
    const u = me(); const d = find(id, u.id);
    if (d.ownerId !== u.id) throw new ApiError(403, "Only the owner can change sharing.");
    delete d.shares[userId];
    return delay(undefined as void);
  },
};
