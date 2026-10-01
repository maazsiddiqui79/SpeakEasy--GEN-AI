// ═══════════════════════════════════════════════════════════════
// SPEAK EASY — Session Store
// ═══════════════════════════════════════════════════════════════

export function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

const SESSIONS_KEY = 'speak_easy_sessions';
