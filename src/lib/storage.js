const PREFIX = 'smart-todo:'

export const KEYS = {
  tasks: `${PREFIX}tasks`,
  user: `${PREFIX}user`,
  settings: `${PREFIX}settings`,
  notifications: `${PREFIX}notification-state`,
  focusSessions: `${PREFIX}focus-sessions`,
}

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    
  }
}

export function clearAll() {
  Object.values(KEYS).forEach(remove)
}

export function exportJson(value) {
  return JSON.stringify({ format: 'taskflow-backup', version: 1, exportedAt: new Date().toISOString(), ...value }, null, 2)
}
