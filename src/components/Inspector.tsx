import {
  BadgeCheck,
  Box,
  Braces,
  ExternalLink,
  LockKeyhole,
  Play,
  ShieldCheck,
  Star,
} from 'lucide-react'
import type { Project } from '../types'
import { StatusBadge } from './StatusBadge'

type InspectorProps = {
  project: Project
  onOpenWorkspace: () => void
}

export function Inspector({ project, onOpenWorkspace }: InspectorProps) {
  return (
    <aside className="inspector" aria-label={`${project.name} inspector`}>
      <div className="inspector-title">
        <div>
          <h2>{project.name}</h2>
          <p>{project.repoPath}</p>
        </div>
        <button className="star-button" type="button" aria-label="Star project">
          <Star size={16} />
          Star
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Project details">
        <button className="is-active" type="button" role="tab">
          Overview
        </button>
        <button type="button" role="tab">
          Checks
        </button>
        <button type="button" role="tab">
          Settings
        </button>
      </div>

      <section className="inspector-section">
        <h3>Tech Stack</h3>
        <div className="stack-list">
          {project.stack.map((item) => (
            <span key={item}>
              <Box size={14} />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="inspector-section">
        <h3>Scripts</h3>
        <div className="script-list">
          {project.scripts.length > 0 ? (
            project.scripts.map((script) => (
              <div key={script.name}>
                <strong>{script.name}</strong>
                <code>{script.command}</code>
                <Play size={13} fill="currentColor" />
              </div>
            ))
          ) : (
            <p>No runnable scripts detected.</p>
          )}
        </div>
      </section>

      <section className="inspector-section">
        <h3>Security & Quality</h3>
        <p className="scan-note">
          <ShieldCheck size={15} />
          Local static scan completed
        </p>
        <div className="check-list">
          {project.security.map((check) => (
            <div key={check.label}>
              <span>
                {check.label === 'Secrets' ? <LockKeyhole size={16} /> : check.label === 'README' ? <Braces size={16} /> : <BadgeCheck size={16} />}
                {check.label}
              </span>
              <StatusBadge state={check.state} label={check.detail} />
            </div>
          ))}
        </div>
      </section>

      <section className="inspector-section preview-card">
        <h3>Preview</h3>
        <StatusBadge state="pass" label="Live sandbox" />
        <button className="primary-button wide" type="button" onClick={onOpenWorkspace}>
          Open in Workspace
          <ExternalLink size={17} />
        </button>
      </section>
    </aside>
  )
}
