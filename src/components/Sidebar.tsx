import {
  Braces,
  Command,
  FolderKanban,
  GitFork,
  LayoutDashboard,
  PanelsTopLeft,
  Rocket,
  Settings,
  Users,
} from 'lucide-react'

type SidebarProps = {
  activeView: 'dashboard' | 'workspace'
  onNavigate: (view: 'dashboard' | 'workspace') => void
  onOpenCommandPalette: () => void
}

export function Sidebar({ activeView, onNavigate, onOpenCommandPalette }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <Rocket size={22} />
        </span>
        <span>LaunchDeck</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={activeView === 'dashboard' ? 'is-active' : ''}
          type="button"
          onClick={() => onNavigate('dashboard')}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        <button type="button" onClick={() => onNavigate('dashboard')}>
          <FolderKanban size={18} />
          Projects
        </button>
        <button
          className={activeView === 'workspace' ? 'is-active' : ''}
          type="button"
          onClick={() => onNavigate('workspace')}
        >
          <PanelsTopLeft size={18} />
          Workspace
        </button>
        <button type="button" onClick={() => onNavigate('dashboard')}>
          <Settings size={18} />
          Settings
        </button>
      </nav>

      <div className="workspace-groups">
        <p>Your Workspaces</p>
        <button type="button">
          <Users size={16} />
          My Workspace
        </button>
        <button type="button">
          <Users size={16} />
          Hackathon Team
        </button>
      </div>

      <div className="shortcut-list">
        <p>Shortcuts</p>
        <button type="button" onClick={onOpenCommandPalette}>
          <Command size={15} />
          <span>Command Palette</span>
          <kbd>⌘K</kbd>
        </button>
        <button type="button">
          <Braces size={15} />
          <span>Quick Open</span>
          <kbd>⌘P</kbd>
        </button>
      </div>

      <div className="sidebar-footer">
        <span>LaunchDeck v0.1.0</span>
        <span>Open Source</span>
        <a
          aria-label="GitHub repository"
          href="https://github.com/kaantaskentt/launchdeck"
          target="_blank"
          rel="noreferrer"
        >
          <GitFork size={18} />
        </a>
      </div>
    </aside>
  )
}
