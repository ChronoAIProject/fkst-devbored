import { describe, expect, it } from 'vitest'

import { isAllowedApiOrigin } from '../../proxy-security'

describe('isAllowedApiOrigin', () => {
  it('allows absent Origin and the exact loopback Vite origin', () => {
    expect(isAllowedApiOrigin(undefined, '127.0.0.1:5173')).toBe(true)
    expect(isAllowedApiOrigin(undefined, '127.0.0.1:5173', 'POST')).toBe(false)
    expect(isAllowedApiOrigin('http://127.0.0.1:5173', '127.0.0.1:5173')).toBe(true)
  })

  it('rejects foreign, malformed, and host-mismatched origins before proxying', () => {
    expect(isAllowedApiOrigin('https://attacker.example', '127.0.0.1:5173')).toBe(false)
    expect(isAllowedApiOrigin('http://127.0.0.1:8472', '127.0.0.1:5173')).toBe(false)
    expect(isAllowedApiOrigin('http://localhost:5173', '127.0.0.1:5173')).toBe(false)
    expect(isAllowedApiOrigin('http://127.0.0.1:5173', 'attacker.example:5173')).toBe(false)
    expect(isAllowedApiOrigin('http://127.0.0.1:70000', '127.0.0.1:70000')).toBe(false)
  })
})
