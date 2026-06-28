export type ProjectHealth = 'healthy' | 'degraded' | 'review'

export type ProjectSource = 'sample' | 'folder' | 'zip' | 'github'

export type SecurityState = 'pass' | 'warn' | 'neutral'

export type ProjectScript = {
  name: string
  command: string
}

export type ProjectFile = {
  path: string
  name: string
  content: string
  size: number
  language: string
  lastModified: number
}

export type SecurityCheck = {
  label: string
  state: SecurityState
  detail: string
}

export type ProjectActivity = {
  label: string
  detail: string
  time: string
}

export type Project = {
  id: string
  name: string
  slug: string
  source: ProjectSource
  repoPath: string
  updatedAt: string
  health: ProjectHealth
  healthDetail: string
  runtime: string
  stack: string[]
  scripts: ProjectScript[]
  files: ProjectFile[]
  security: SecurityCheck[]
  activity: ProjectActivity[]
}

export type SkippedFile = {
  path: string
  reason: string
}

export type ImportReport = {
  rootName: string
  importedFiles: number
  skippedFiles: SkippedFile[]
  warnings: string[]
}

export type ImportResult = {
  project: Project
  report: ImportReport
}
