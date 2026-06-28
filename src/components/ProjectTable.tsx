import { Grid2X2, List, MoreHorizontal, Play, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Project } from '../types'
import { StatusBadge } from './StatusBadge'

type ProjectTableProps = {
  projects: Project[]
  selectedProjectId: string
  onSelectProject: (id: string) => void
  onOpenWorkspace: (id: string) => void
}

export function ProjectTable({
  projects,
  selectedProjectId,
  onSelectProject,
  onOpenWorkspace,
}: ProjectTableProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [filter, setFilter] = useState<'all' | Project['health']>('all')
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string>()

  const visibleProjects = useMemo(
    () => projects.filter((project) => filter === 'all' || project.health === filter),
    [filter, projects],
  )

  const copyRepoPath = async (repoPath: string) => {
    await navigator.clipboard?.writeText(repoPath)
    setOpenMenuProjectId(undefined)
  }

  return (
    <section className="project-table" aria-label="Projects">
      <div className="section-heading">
        <div>
          <h2>Projects</h2>
          <span>{visibleProjects.length}</span>
        </div>
        <div className="view-controls" aria-label="Project view controls">
          <button
            type="button"
            className={viewMode === 'grid' ? 'is-active' : ''}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          >
            <Grid2X2 size={17} />
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? 'is-active' : ''}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            <List size={17} />
          </button>
          <select
            aria-label="Filter projects"
            value={filter}
            onChange={(event) => setFilter(event.target.value as 'all' | Project['health'])}
          >
            <option value="all">All</option>
            <option value="healthy">Healthy</option>
            <option value="review">Needs review</option>
            <option value="degraded">Degraded</option>
          </select>
        </div>
      </div>

      <div className={`project-list project-list--${viewMode}`} role="table" aria-label="Imported projects">
        <div className="project-row project-row--head" role="row">
          <span role="columnheader">Name</span>
          <span role="columnheader">Updated</span>
          <span role="columnheader">Health</span>
          <span role="columnheader">Runtime</span>
          <span role="columnheader">Open</span>
        </div>

        {visibleProjects.map((project) => (
          <div
            key={project.id}
            className={`project-row ${selectedProjectId === project.id ? 'is-selected' : ''}`}
            role="row"
            tabIndex={0}
            onClick={() => onSelectProject(project.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectProject(project.id)
              }
            }}
          >
            <span className="project-name" role="cell">
              <span className="project-logo" aria-hidden="true">
                {project.name.slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{project.name}</strong>
                <small>{project.repoPath}</small>
              </span>
            </span>
            <span role="cell">{formatRelativeTime(project.updatedAt)}</span>
            <span role="cell">
              <StatusBadge state={project.health} label={project.health === 'healthy' ? 'Healthy' : project.health === 'degraded' ? 'Degraded' : 'Review'} />
              <small>{project.healthDetail}</small>
            </span>
            <span role="cell">
              <strong>{project.runtime}</strong>
              <small>{project.files.length} files</small>
            </span>
            <span className="project-actions" role="cell">
              <button
                className="play-button"
                type="button"
                aria-label={`Open ${project.name} workspace`}
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenWorkspace(project.id)
                }}
              >
                <Play size={15} fill="currentColor" />
              </button>
              <button
                className="row-menu"
                type="button"
                aria-label={`More actions for ${project.name}`}
                aria-expanded={openMenuProjectId === project.id}
                onClick={(event) => {
                  event.stopPropagation()
                  setOpenMenuProjectId((current) => (current === project.id ? undefined : project.id))
                }}
              >
                <MoreHorizontal size={17} />
              </button>
              {openMenuProjectId === project.id ? (
                <div className="row-menu-popover" role="menu" aria-label={`${project.name} actions`}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(event) => {
                      event.stopPropagation()
                      setOpenMenuProjectId(undefined)
                      onOpenWorkspace(project.id)
                    }}
                  >
                    Open workspace
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelectProject(project.id)
                      setOpenMenuProjectId(undefined)
                    }}
                  >
                    Select project
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(event) => {
                      event.stopPropagation()
                      void copyRepoPath(project.repoPath)
                    }}
                  >
                    Copy repo path
                  </button>
                </div>
              ) : null}
            </span>
          </div>
        ))}

        {visibleProjects.length === 0 ? (
          <div className="project-empty" role="row">
            No projects match this filter.
          </div>
        ) : null}
      </div>

      <button className="text-link" type="button" onClick={() => setFilter('all')}>
        View all projects
        <Star size={14} />
      </button>
    </section>
  )
}

function formatRelativeTime(isoDate: string): string {
  const elapsed = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.max(1, Math.round(elapsed / 60_000))

  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return `${Math.round(hours / 24)}d ago`
}
