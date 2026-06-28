import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('LaunchDeck app', () => {
  it('renders the project cockpit and opens the workspace', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('LaunchDeck')).toBeInTheDocument()
    expect(screen.getByText('Import your project to get started')).toBeInTheDocument()
    expect(screen.getAllByText('launchdeck-web').length).toBeGreaterThan(0)

    await user.click(screen.getByLabelText('Open launchdeck-web workspace'))

    expect(screen.getByLabelText('launchdeck-web coding workspace')).toBeInTheDocument()
    expect(screen.getByLabelText('File explorer')).toBeInTheDocument()
    expect(screen.getByLabelText('Live preview')).toBeInTheDocument()
  })

  it('opens project switching from the command palette', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('Press ⌘K to open command palette'))

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open api-server' }))

    expect(screen.getByLabelText('api-server coding workspace')).toBeInTheDocument()
  })
})
