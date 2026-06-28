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
import { useEffect, useState } from 'react'
import type { Project } from '../types'
import { StatusBadge } from './StatusBadge'

type InspectorProps = {
  project: Project
  onOpenWorkspace: () => void
}

export function Inspector({ project, onOpenWorkspace }: InspectorProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'checks' | 'settings'>('overview')
  const [starredProjects, setStarredProjects] = useState<Set<string>>(() => new Set())
  const isStarred = starredProjects.has(project.id)

  useEffect(() => {
    setActiveTab('overview')
  }, [project.id])

  const toggleStar = () => {
    setStarredProjects((current) => {
      const next = new Set(current)

      if (next.has(project.id)) {
        next.delete(project.id)
      } else {
        next.add(project.id)
      }

      return next
    })
  }

  return (
    <aside className="inspector" aria-label={`${project.name} inspector`}>
      <div className="inspector-title">
        <div>
          <h2>{project.name}</h2>
          <p>{project.repoPath}</p>
        </div>
        <button className="star-button" type="button" aria-label="Star project" aria-pressed={isStarred} onClick={toggleStar}>
          <Star size={16} fill={isStarred ? 'currentColor' : 'none'} />
          {isStarred ? 'Starred' : 'Star'}
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Project details">
        <button
          className={activeTab === 'overview' ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'checks' ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={activeTab === 'checks'}
          onClick={() => setActiveTab('checks')}
        >
          Checks
        </button>
        <button
          className={activeTab === 'settings' ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
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

          <section className="inspector-section preview-card">
            <h3>Preview</h3>
            <StatusBadge state="pass" label="Live sandbox" />
            <button className="primary-button wide" type="button" onClick={onOpenWorkspace}>
              Open in Workspace
              <ExternalLink size={17} />
            </button>
          </section>
        </>
      ) : null}

      {activeTab === 'checks' ? (
        <>
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

          <section className="inspector-section">
            <h3>Activity</h3>
            <div className="activity-list">
              {project.activity.map((item) => (
                <div key={`${item.label}-${item.time}`}>
                  <strong>{item.label}</strong>
                  <p>{item.detail}</p>
                  <small>{item.time}</small>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {activeTab === 'settings' ? (
        <section className="inspector-section settings-panel">
          <h3>Workspace Settings</h3>
          <p>Source: {project.source}</p>
          <p>Files indexed locally: {project.files.length}</p>
          <p>Preview scripts start blocked and only run after you enable them in the workspace.</p>
          <button className="primary-button wide" type="button" onClick={onOpenWorkspace}>
            Manage in Workspace
            <ExternalLink size={17} />
          </button>
        </section>
      ) : null}
    </aside>
  )
}
