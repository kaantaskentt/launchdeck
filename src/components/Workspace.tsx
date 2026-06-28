import {
  Bug,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileCode2,
  Folder,
  MonitorPlay,
  PanelLeft,
  RefreshCw,
  Save,
  ShieldCheck,
  TerminalSquare,
  X,
} from 'lucide-react'
import type { Project, ProjectFile } from '../types'
import { createPreviewDocument } from '../lib/projectImport'

type WorkspaceProps = {
  project: Project
  activeFilePath: string
  previewAllowsScripts: boolean
  onSelectFile: (path: string) => void
  onUpdateFile: (path: string, content: string) => void
  onToggleScriptPreview: () => void
}

export function Workspace({
  project,
  activeFilePath,
  previewAllowsScripts,
  onSelectFile,
  onUpdateFile,
  onToggleScriptPreview,
}: WorkspaceProps) {
  const activeFile = project.files.find((file) => file.path === activeFilePath) ?? project.files[0]
  const previewDocument = createPreviewDocument(project, activeFile.path, previewAllowsScripts)
  const folders = buildExplorer(project.files)

  return (
    <section className="workspace" aria-label={`${project.name} coding workspace`}>
      <div className="workspace-titlebar">
        <div>
          <Code2 size={17} />
          <strong>{project.name}</strong>
          <span />
        </div>
        <div className="workspace-actions">
          <button type="button">
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            className={previewAllowsScripts ? 'danger-button' : ''}
            type="button"
            onClick={onToggleScriptPreview}
          >
            <ShieldCheck size={15} />
            {previewAllowsScripts ? 'JS Enabled' : 'Safe Preview'}
          </button>
          <button type="button">
            <ExternalLink size={15} />
            Pop out
          </button>
        </div>
      </div>

      <div className="workspace-grid">
        <aside className="explorer" aria-label="File explorer">
          <div className="pane-heading">
            <PanelLeft size={15} />
            Explorer
          </div>
          <div className="file-tree">
            {folders.map((folder) => (
              <div key={folder.name} className="tree-group">
                {folder.name ? (
                  <p>
                    <Folder size={14} />
                    {folder.name}
                  </p>
                ) : null}
                {folder.files.map((file) => (
                  <button
                    key={file.path}
                    className={file.path === activeFile.path ? 'is-active' : ''}
                    type="button"
                    onClick={() => onSelectFile(file.path)}
                  >
                    <FileCode2 size={14} />
                    {file.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <section className="editor-pane" aria-label="Code editor">
          <div className="editor-tabs">
            <span>
              <FileCode2 size={14} />
              {activeFile.name}
            </span>
            <button type="button" aria-label="Close tab">
              <X size={14} />
            </button>
          </div>
          <textarea
            spellCheck={false}
            aria-label={`${activeFile.name} editor`}
            value={activeFile.content}
            onChange={(event) => onUpdateFile(activeFile.path, event.target.value)}
          />
          <div className="editor-status">
            <span>Ln 1, Col 1</span>
            <span>{activeFile.language}</span>
            <span>UTF-8</span>
            <button type="button">
              <Save size={14} />
              Saved locally
            </button>
          </div>
        </section>

        <section className="preview-pane" aria-label="Live preview">
          <div className="preview-toolbar">
            <span>
              <MonitorPlay size={15} />
              Preview
            </span>
            <code>launchdeck://sandbox</code>
          </div>
          <iframe
            title={`${project.name} preview`}
            srcDoc={previewDocument}
            sandbox={previewAllowsScripts ? 'allow-scripts' : ''}
          />
        </section>

        <section className="terminal-pane" aria-label="Terminal output">
          <div className="terminal-tabs">
            <span>
              <TerminalSquare size={15} />
              Terminal
            </span>
            <span>Problems</span>
            <span>Output</span>
            <span>Debug Console</span>
          </div>
          <div className="terminal-output">
            <p>
              <CheckCircle2 size={14} /> Indexed {project.files.length} safe text files
            </p>
            <p>
              <ShieldCheck size={14} /> Sandbox ready with script execution{' '}
              {previewAllowsScripts ? 'enabled' : 'blocked'}
            </p>
            <p>
              <Bug size={14} /> Static checks completed for secrets, license, README, and lockfiles
            </p>
          </div>
        </section>
      </div>
    </section>
  )
}

type ExplorerGroup = {
  name: string
  files: ProjectFile[]
}

function buildExplorer(files: ProjectFile[]): ExplorerGroup[] {
  const groups = new Map<string, ProjectFile[]>()

  for (const file of files) {
    const folder = file.path.includes('/') ? file.path.split('/')[0] : ''
    const group = groups.get(folder) ?? []
    group.push(file)
    groups.set(folder, group)
  }

  return Array.from(groups.entries()).map(([name, groupFiles]) => ({
    name,
    files: groupFiles.sort((a, b) => a.path.localeCompare(b.path)),
  }))
}
