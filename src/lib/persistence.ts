import type { Project } from '../types'

const STORAGE_KEY = 'launchdeck.projects.v1'
const MAX_STORED_PROJECTS = 24

export function loadStoredProjects(): Project[] {
  if (typeof localStorage === 'undefined') return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []

    if (!Array.isArray(parsed)) return []

    return parsed.filter(isProjectLike)
  } catch {
    return []
  }
}

export function saveStoredProjects(projects: Project[]): void {
  if (typeof localStorage === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_STORED_PROJECTS)))
  } catch {
    // Storage quota failures should never break the workspace.
  }
}

function isProjectLike(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false

  const record = value as Partial<Project>
  return Boolean(record.id && record.name && Array.isArray(record.files))
}
