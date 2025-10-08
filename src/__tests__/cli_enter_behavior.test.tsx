import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from './utils'
import userEvent from '@testing-library/user-event'
import { CLI } from '../ui/CLI'

// These tests focus on interaction semantics around autocomplete + Enter.
// We rely on the in-memory VFS defined in vfs.ts.
// Scenarios covered:
// 1. Single-candidate completion (cat R -> README.md) : Enter executes immediately.
// 2. Multi-candidate completion (cat pro -> profile/ vs projects/) : first Enter confirms (no execution), second Enter executes (file case) or triggers directory suppression logic.
// 3. Multi-candidate directory drilling (cat profile/ a -> about.md) : First Enter after selecting about.md executes (since it's now a single-candidate or confirmed file path).
// 4. cat profile/ (directory only) after multi-candidate selection: first Enter confirms directory (no execution), second Enter executes error (since cat on dir) or waits for drilling.
// NOTE: Because executing 'cat <dir>/' yields an error (cannot cat a directory), we assert presence of the error line only after second Enter.

async function typeAndTab(input: HTMLInputElement, value: string) {
  await userEvent.type(input, value)
  await userEvent.keyboard('{Tab}')
}

async function pressEnter() {
  await userEvent.keyboard('{Enter}')
}

describe('CLI Enter + autocomplete behavior', () => {
  it('single-candidate (cat R -> README.md): Enter executes immediately', async () => {
    render(<CLI />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    await typeAndTab(input, 'cat R')
    await pressEnter()
    const readmeLine = await screen.findByText(/Welcome!/)
    expect(readmeLine).toBeInTheDocument()
  })

  it('multi-candidate (cat pro) first Enter confirms, second executes after file selection', async () => {
    render(<CLI />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    await typeAndTab(input, 'cat pro')

    await pressEnter() // swallow
    expect(screen.queryByText(/JSON-Grep/)).not.toBeInTheDocument()
    expect(screen.queryByText(/usage: cat/)).not.toBeInTheDocument()

    if (input.value.includes('profile/')) {
      await userEvent.type(input, 'a')
      await userEvent.keyboard('{Tab}')
    } else if (input.value.includes('projects/')) {
      await userEvent.type(input, 'jgrep/README')
      await userEvent.keyboard('{Tab}')
    }

    await pressEnter()
    const about = screen.queryByText(/Siwoo Lee/)
    const jgrep = screen.queryByText(/JSON-Friendly Grep/)
    expect(about ?? jgrep).toBeInTheDocument()
  })

  it('multi-candidate directory token cat profile/ — first Enter confirm, second Enter error (cannot cat dir)', async () => {
    render(<CLI />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    await typeAndTab(input, 'cat pro')
    if (!input.value.includes('profile/')) {
      // rotate suggestions (another Tab)
      await userEvent.keyboard('{Tab}')
    }
    expect(input.value.includes('profile/')).toBe(true)

    await pressEnter() // confirm only
    expect(screen.queryByText(/No such file/)).not.toBeInTheDocument()

    await pressEnter() // now execute -> expect directory error
    const err = screen.queryByText(/cat: .*: No such file/)
    expect(err).toBeInTheDocument()
  })

  it('editing after swallowed Enter clears suppression (cat pro -> confirm -> edit -> Enter executes new path)', async () => {
    render(<CLI />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    await typeAndTab(input, 'cat pro')
    await pressEnter() // confirm autocomplete
    const before = screen.queryAllByRole('group', { name: 'command' }).length
    // Edit last token to force different candidate (add 'j')
    await userEvent.type(input, 'j')
    await userEvent.keyboard('{Tab}')
    await pressEnter() // should execute now (not swallowed because input changed)
    const after = screen.queryAllByRole('group', { name: 'command' }).length
    expect(after).toBe(before + 1)
  })

  it('single-candidate cd profile/ executes immediately after completion', async () => {
    render(<CLI />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    await typeAndTab(input, 'cd pro') // ambiguous -> confirm first Enter
    await pressEnter() // swallow (confirm selection)
    if (!input.value.includes('profile/')) {
      // rotate until profile/
      await userEvent.keyboard('{Tab}')
      expect(input.value.includes('profile/')).toBe(true)
    }
    // Now refine to cd profile/ (already a directory token). Add trailing Enter should change cwd (no error)
    const before = screen.queryAllByRole('group', { name: 'command' }).length
    await pressEnter() // first Enter after confirm should suppress directory execution
    await pressEnter() // second Enter executes cd
    const after = screen.queryAllByRole('group', { name: 'command' }).length
    expect(after).toBe(before + 1)
  })
})
