/// <reference types="vite/client" />

declare global {
  interface Window {
    axe: typeof import('axe-core')
  }
}

export {}
