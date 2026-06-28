import { Grid2X2, List, MoreHorizontal, Play, Star } from 'lucide-react'
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
  return (
    <section className="project-table" aria-label="Projects">
      <div className="section-heading">
        <div>
          <h2>Projects</h2>
          <span>{projects.length}</span>
        </div>
        <div className="view-controls" aria-label="Project view controls">
          <button type="button" aria-label="Grid view">
            <Grid2X2 size={17} />
          </button>
          <button type="button" className="is-active" aria-label="List view">
            <List size={17} />
          </button>
          <select aria-label="Filter projects" defaultValue="all">
            <option value="all">All</option>
            <option value="healthy">Healthy</option>
            <option value="review">Needs review</option>
          </select>
        </div>
      </div>

      <div className="project-list" role="table" aria-label="Imported projects">
        <div className="project-row project-row--head" role="row">
          <span role="columnheader">Name</span>
          <span role="columnheader">Updated</span>
          <span role="columnheader">Health</span>
          <span role="columnheader">Runtime</span>
          <span role="columnheader">Open</span>
        </div>

        {projects.map((project) => (
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
              <button className="row-menu" type="button" aria-label={`More actions for ${project.name}`}>
                <MoreHorizontal size={17} />
              </button>
            </span>
          </div>
        ))}
      </div>

      <button className="text-link" type="button">
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
