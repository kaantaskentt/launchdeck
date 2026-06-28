import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import './App.css'
import { CommandPalette } from './components/CommandPalette'
import { ImportStrip } from './components/ImportStrip'
import { Inspector } from './components/Inspector'
import { ProjectTable } from './components/ProjectTable'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Workspace } from './components/Workspace'
import { sampleProjects } from './data/sampleProjects'
import { importFileList, importGitHubRepository, importZipFile, type ImportableFile } from './lib/projectImport'
import { loadStoredProjects, saveStoredProjects } from './lib/persistence'
import type { ImportReport, Project } from './types'

type FileSystemFileHandleLike = {
  kind: 'file'
  name: string
  getFile: () => Promise<File>
}

type FileSystemDirectoryHandleLike = {
  kind: 'directory'
  name: string
  values: () => AsyncIterable<FileSystemFileHandleLike | FileSystemDirectoryHandleLike>
}

type WindowWithDirectoryPicker = Window &
  typeof globalThis & {
    showDirectoryPicker?: (options?: { mode?: 'read' }) => Promise<FileSystemDirectoryHandleLike>
  }

function App() {
  const folderInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const [projects, setProjects] = useState<Project[]>(() => {
    const storedProjects = loadStoredProjects()
    return storedProjects.length > 0 ? storedProjects : sampleProjects
  })
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id ?? '')
  const [activeView, setActiveView] = useState<'dashboard' | 'workspace'>('dashboard')
  const [activeFileByProject, setActiveFileByProject] = useState<Record<string, string>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [importReport, setImportReport] = useState<ImportReport>()
  const [importError, setImportError] = useState<string>()
  const [githubUrl, setGithubUrl] = useState('')
  const [isCommandOpen, setCommandOpen] = useState(false)
  const [previewAllowsScripts, setPreviewAllowsScripts] = useState(false)

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId],
  )

  const activeFilePath =
    selectedProject && activeFileByProject[selectedProject.id]
      ? activeFileByProject[selectedProject.id]
      : selectedProject?.files[0]?.path

  useEffect(() => {
    saveStoredProjects(projects)
  }, [projects])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const addImportedProject = useCallback((project: Project, report: ImportReport) => {
    setProjects((currentProjects) => [project, ...currentProjects.filter((item) => item.id !== project.id)])
    setSelectedProjectId(project.id)
    setActiveFileByProject((current) => ({
      ...current,
      [project.id]: project.files[0]?.path ?? '',
    }))
    setImportReport(report)
    setImportError(undefined)
    setActiveView('workspace')
  }, [])

  const runImport = useCallback(
    async (importer: () => Promise<{ project: Project; report: ImportReport }>) => {
      setIsImporting(true)
      setImportError(undefined)

      try {
        const result = await importer()
        addImportedProject(result.project, result.report)
      } catch (error) {
        if (isUserAbortError(error)) return

        setImportError(error instanceof Error ? error.message : 'Import failed. Try another project.')
      } finally {
        setIsImporting(false)
      }
    },
    [addImportedProject],
  )

  const handlePickFolder = useCallback(() => {
    const showDirectoryPicker = (window as WindowWithDirectoryPicker).showDirectoryPicker

    if (!showDirectoryPicker) {
      folderInputRef.current?.click()
      return
    }

    void runImport(async () => {
      const directoryHandle = await showDirectoryPicker({ mode: 'read' })
      const files = await collectDirectoryFiles(directoryHandle)
      return importFileList(files)
    })
  }, [runImport])

  const handleFolderChange = (files: FileList | null) => {
    if (!files?.length) return
    const fileArray = Array.from(files)
    void runImport(() => importFileList(fileArray))
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  const handleZipChange = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    void runImport(() => importZipFile(file))
    if (zipInputRef.current) zipInputRef.current.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (!files.length) return

    const firstFile = files[0]
    if (firstFile.name.toLowerCase().endsWith('.zip')) {
      void runImport(() => importZipFile(firstFile))
      return
    }

    void runImport(() => importFileList(files))
  }

  const handleOpenWorkspace = (projectId: string) => {
    setSelectedProjectId(projectId)
    setActiveView('workspace')
  }

  const handleUpdateFile = (path: string, content: string) => {
    if (!selectedProject) return

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              updatedAt: new Date().toISOString(),
              files: project.files.map((file) =>
                file.path === path ? { ...file, content, size: new Blob([content]).size } : file,
              ),
            }
          : project,
      ),
    )
  }

  return (
    <div className="app-shell" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenCommandPalette={() => setCommandOpen(true)}
      />

      <main className="app-main">
        <TopBar onImport={handlePickFolder} onOpenCommandPalette={() => setCommandOpen(true)} />

        <div className="content-grid">
          <div className="primary-column">
            <ImportStrip
              isImporting={isImporting}
              importReport={importReport}
              githubUrl={githubUrl}
              error={importError}
              onGithubUrlChange={setGithubUrl}
              onPickFolder={handlePickFolder}
              onPickZip={() => zipInputRef.current?.click()}
              onImportGithub={() => void runImport(() => importGitHubRepository(githubUrl))}
              onDismissReport={() => setImportReport(undefined)}
            />

            <ProjectTable
              projects={projects}
              selectedProjectId={selectedProject?.id ?? ''}
              onSelectProject={setSelectedProjectId}
              onOpenWorkspace={handleOpenWorkspace}
            />

            {activeView === 'workspace' && selectedProject && activeFilePath ? (
              <Workspace
                project={selectedProject}
                activeFilePath={activeFilePath}
                previewAllowsScripts={previewAllowsScripts}
                onSelectFile={(path) =>
                  setActiveFileByProject((current) => ({ ...current, [selectedProject.id]: path }))
                }
                onUpdateFile={handleUpdateFile}
                onToggleScriptPreview={() => setPreviewAllowsScripts((current) => !current)}
              />
            ) : selectedProject && activeFilePath ? (
              <div className="workspace-teaser">
                <Workspace
                  project={selectedProject}
                  activeFilePath={activeFilePath}
                  previewAllowsScripts={previewAllowsScripts}
                  onSelectFile={(path) =>
                    setActiveFileByProject((current) => ({ ...current, [selectedProject.id]: path }))
                  }
                  onUpdateFile={handleUpdateFile}
                  onToggleScriptPreview={() => setPreviewAllowsScripts((current) => !current)}
                />
              </div>
            ) : null}
          </div>

          {selectedProject ? <Inspector project={selectedProject} onOpenWorkspace={() => setActiveView('workspace')} /> : null}
        </div>

        <input
          ref={folderInputRef}
          className="visually-hidden"
          type="file"
          multiple
          tabIndex={-1}
          aria-label="Import folder"
          onChange={(event) => handleFolderChange(event.target.files)}
          {...{ webkitdirectory: '', directory: '' }}
        />
        <input
          ref={zipInputRef}
          className="visually-hidden"
          type="file"
          accept=".zip,application/zip"
          tabIndex={-1}
          aria-label="Import zip"
          onChange={(event) => handleZipChange(event.target.files)}
        />
      </main>

      <CommandPalette
        isOpen={isCommandOpen}
        projects={projects}
        onClose={() => setCommandOpen(false)}
        onImport={handlePickFolder}
        onOpenProject={handleOpenWorkspace}
      />
    </div>
  )
}

async function collectDirectoryFiles(
  directoryHandle: FileSystemDirectoryHandleLike,
  parentPath = directoryHandle.name,
): Promise<ImportableFile[]> {
  const files: ImportableFile[] = []

  for await (const entry of directoryHandle.values()) {
    const entryPath = `${parentPath}/${entry.name}`

    if (entry.kind === 'directory') {
      files.push(...(await collectDirectoryFiles(entry, entryPath)))
      continue
    }

    const file = await entry.getFile()
    files.push({
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      webkitRelativePath: entryPath,
      text: () => file.text(),
    })
  }

  return files
}

function isUserAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export default App
