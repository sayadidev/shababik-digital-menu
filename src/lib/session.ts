"use client";

let _sessionId: string | null = null;

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  if (_sessionId) return _sessionId;

  try {
    const stored = localStorage.getItem("shababik_session_id");
    if (stored) {
      _sessionId = stored;
      return stored;
    }
  } catch {}

  const id = crypto.randomUUID();
  _sessionId = id;
  try {
    localStorage.setItem("shababik_session_id", id);
  } catch {}
  return id;
}
