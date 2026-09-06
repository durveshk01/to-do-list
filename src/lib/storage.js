const PREFIX = 'smart-todo:'

export const KEYS = {
  tasks: `${PREFIX}tasks`,
  user: `${PREFIX}user`,
  settings: `${PREFIX}settings`,
  notifications: `${PREFIX}notification-state`,
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
    /* storage full or blocked — the prototype keeps working in memory */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function clearAll() {
  Object.values(KEYS).forEach(remove)
}
