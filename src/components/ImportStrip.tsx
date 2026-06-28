import { GitBranch, ShieldCheck, UploadCloud, X } from 'lucide-react'
import type { ImportReport } from '../types'

type ImportStripProps = {
  isImporting: boolean
  importReport?: ImportReport
  githubUrl: string
  error?: string
  onGithubUrlChange: (value: string) => void
  onPickFolder: () => void
  onPickZip: () => void
  onImportGithub: () => void
  onDismissReport: () => void
}

export function ImportStrip({
  isImporting,
  importReport,
  githubUrl,
  error,
  onGithubUrlChange,
  onPickFolder,
  onPickZip,
  onImportGithub,
  onDismissReport,
}: ImportStripProps) {
  return (
    <section className="import-strip" aria-label="Import project">
      <div className="import-icon" aria-hidden="true">
        <UploadCloud size={28} />
      </div>
      <div className="import-copy">
        <h1>Import your project to get started</h1>
        <p>Drag in a folder, select a local directory, import a zip, or pull a public GitHub repo.</p>
        {isImporting ? <p className="import-status">Indexing project locally...</p> : null}
        {importReport ? (
          <p className="import-report">
            Imported {importReport.importedFiles} files from {importReport.rootName}
            {importReport.skippedFiles.length > 0 ? `, skipped ${importReport.skippedFiles.length}` : ''}.
          </p>
        ) : null}
        {error ? <p className="import-error">{error}</p> : null}
      </div>

      <div className="import-actions">
        <button className="primary-button" type="button" onClick={onPickFolder} disabled={isImporting}>
          <UploadCloud size={17} />
          {isImporting ? 'Importing...' : 'Import Folder'}
        </button>
        <button className="secondary-button" type="button" onClick={onPickZip} disabled={isImporting}>
          <ShieldCheck size={17} />
          Import Zip
        </button>
        <div className="github-import">
          <input
            aria-label="GitHub repository URL"
            placeholder="github.com/owner/repo"
            value={githubUrl}
            onChange={(event) => onGithubUrlChange(event.target.value)}
          />
          <button className="secondary-button" type="button" onClick={onImportGithub} disabled={isImporting}>
            <GitBranch size={17} />
            Import
          </button>
        </div>
      </div>

      {importReport ? (
        <button className="dismiss-button" type="button" onClick={onDismissReport} aria-label="Dismiss import report">
          <X size={16} />
        </button>
      ) : null}
    </section>
  )
}
