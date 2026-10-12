export interface User {
  id: string;
  name: string;
  email: string;
}

export type Role = "owner" | "editor" | "viewer";

export interface DocSummary {
  id: string;
  title: string;
  updatedAt: string; // ISO
  ownerName: string;
  role: Role; // caller's role; "owner" => owned, otherwise shared with me
}

export interface Doc extends DocSummary {
  content: string; // sanitized HTML produced by the editor
}

export interface Share {
  userId: string;
  name: string;
  email: string;
  role: Exclude<Role, "owner">;
}
