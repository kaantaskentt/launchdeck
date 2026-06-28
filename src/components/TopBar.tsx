import { Bell, GitBranch, Search, UploadCloud } from 'lucide-react'

type TopBarProps = {
  onImport: () => void
  onOpenCommandPalette: () => void
}

export function TopBar({ onImport, onOpenCommandPalette }: TopBarProps) {
  return (
    <header className="topbar">
      <button className="command-input" type="button" onClick={onOpenCommandPalette}>
        <Search size={17} />
        <span>Press ⌘K to open command palette</span>
      </button>

      <button className="primary-button" type="button" onClick={onImport}>
        <UploadCloud size={17} />
        Import Project
      </button>

      <button className="github-chip" type="button" aria-label="GitHub connection status">
        <GitBranch size={17} />
        <span>GitHub</span>
        <strong>Connected</strong>
      </button>

      <button className="icon-button" type="button" aria-label="Notifications">
        <Bell size={18} />
      </button>

      <div className="avatar" aria-label="Current user">
        K
        <span aria-hidden="true" />
      </div>
    </header>
  )
}
