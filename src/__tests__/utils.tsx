export * from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export async function typeAndTab(input: HTMLInputElement, text: string) {
  await userEvent.type(input, text)
  await userEvent.keyboard('{Tab}')
}

export async function pressEnter() {
  await userEvent.keyboard('{Enter}')
}
