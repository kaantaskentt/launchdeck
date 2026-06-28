import { Command, FolderOpen, Search, UploadCloud, X } from 'lucide-react'
import type { Project } from '../types'

type CommandPaletteProps = {
  isOpen: boolean
  projects: Project[]
  onClose: () => void
  onImport: () => void
  onOpenProject: (id: string) => void
}

export function CommandPalette({
  isOpen,
  projects,
  onClose,
  onImport,
  onOpenProject,
}: CommandPaletteProps) {
  if (!isOpen) return null

  return (
    <div className="command-overlay" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="command-panel">
        <div className="command-panel-top">
          <Search size={18} />
          <input autoFocus placeholder="Type a command or project name" aria-label="Command search" />
          <button type="button" aria-label="Close command palette" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="command-actions">
          <button
            type="button"
            onClick={() => {
              onImport()
              onClose()
            }}
          >
            <UploadCloud size={17} />
            Import Project
          </button>
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => {
                onOpenProject(project.id)
                onClose()
              }}
            >
              <FolderOpen size={17} />
              Open {project.name}
            </button>
          ))}
        </div>
        <div className="command-footer">
          <Command size={15} />
          <span>Fast path for imports, project switching, and workspace jumps.</span>
        </div>
      </div>
    </div>
  )
}
