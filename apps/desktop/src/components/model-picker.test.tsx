import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type I18nConfigClient, I18nProvider } from '@/i18n'
import { requestModelOptions } from '@/lib/model-options'

import { ModelPickerDialog } from './model-picker'

vi.mock('@/lib/model-options', () => ({
  requestModelOptions: vi.fn()
}))

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', TestResizeObserver)
Element.prototype.scrollIntoView = function scrollIntoView() {}

function renderPicker(onSelect: (selection: { provider: string; model: string }) => boolean | Promise<boolean>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onOpenChange = vi.fn()
  const configClient: I18nConfigClient = {
    getConfig: vi.fn().mockResolvedValue({ display: { language: 'en' } }),
    saveConfig: vi.fn()
  }

  render(
    <I18nProvider configClient={configClient}>
      <QueryClientProvider client={queryClient}>
        <ModelPickerDialog
          currentModel="gpt-5.5"
          currentProvider="openai-codex"
          onOpenChange={onOpenChange}
          onSelect={onSelect}
          open
          sessionId="session-1"
        />
      </QueryClientProvider>
    </I18nProvider>
  )

  return onOpenChange
}

describe('ModelPickerDialog async selection', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('keeps the picker open when an async live-session switch fails', async () => {
    vi.mocked(requestModelOptions).mockResolvedValue({
      model: 'gpt-5.5',
      provider: 'openai-codex',
      providers: [{ name: 'CHATGPT 系列', slug: 'openai-codex', models: ['gpt-5.6-sol', 'gpt-5.5'] }]
    })
    const onSelect = vi.fn().mockResolvedValue(false)
    const onOpenChange = renderPicker(onSelect)

    fireEvent.click(await screen.findByText('gpt-5.6-sol'))

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith({ provider: 'openai-codex', model: 'gpt-5.6-sol' }))
    await Promise.resolve()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('closes the picker after an async switch succeeds', async () => {
    vi.mocked(requestModelOptions).mockResolvedValue({
      model: 'gpt-5.5',
      provider: 'openai-codex',
      providers: [{ name: 'CHATGPT 系列', slug: 'openai-codex', models: ['gpt-5.6-sol', 'gpt-5.5'] }]
    })
    const onSelect = vi.fn().mockResolvedValue(true)
    const onOpenChange = renderPicker(onSelect)

    fireEvent.click(await screen.findByText('gpt-5.6-sol'))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
