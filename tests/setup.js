import '@testing-library/jest-dom'

const storageMock = (() => {
  let store = {}
  return {
    getItem:  k => store[k] ?? null,
    setItem:  (k, v) => { store[k] = String(v) },
    removeItem: k => { delete store[k] },
    clear:    () => { store = {} },
  }
})()
Object.defineProperty(global, 'localStorage', { value: storageMock, writable: true })
