import type { Doc, DocSummary, Share, User } from "./types";
import { ApiError, getStoredUser, storeUser } from "./api-session";
import { mockApi } from "./mockApi";

/**
 * Thin typed client. Auth is mocked: the logged-in user's id is stored locally
 * and sent as `X-User-Id`. The backend resolves it to a seeded user.
 */
export { ApiError, getStoredUser, storeUser };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const user = getStoredUser();
  if (user) headers.set("X-User-Id", user.id);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const realApi = {
  listUsers: () => request<User[]>("/users"),
  login: (email: string) => request<User>("/auth/login", { method: "POST", body: JSON.stringify({ email }) }),

  listDocs: () => request<DocSummary[]>("/documents"),
  getDoc: (id: string) => request<Doc>(`/documents/${id}`),
  createDoc: (title = "Untitled document") =>
    request<Doc>("/documents", { method: "POST", body: JSON.stringify({ title }) }),
  updateDoc: (id: string, patch: { title?: string; content?: string }) =>
    request<Doc>(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteDoc: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),
  importFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<Doc>("/documents/import", { method: "POST", body: form });
  },

  listShares: (id: string) => request<Share[]>(`/documents/${id}/shares`),
  addShare: (id: string, email: string, role: Share["role"]) =>
    request<Share>(`/documents/${id}/shares`, { method: "POST", body: JSON.stringify({ email, role }) }),
  removeShare: (id: string, userId: string) =>
    request<void>(`/documents/${id}/shares/${userId}`, { method: "DELETE" }),
};

export const api: typeof realApi = import.meta.env.VITE_MOCK ? mockApi : realApi;

export const SUPPORTED_UPLOADS = [".txt", ".md", ".docx"] as const;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
