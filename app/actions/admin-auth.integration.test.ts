import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieSet = vi.hoisted(() => vi.fn())
const redirectMock = vi.hoisted(() => vi.fn(() => { throw new Error("REDIRECT") }))

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ set: cookieSet, delete: vi.fn() })) }))
vi.mock("next/navigation", () => ({ redirect: redirectMock }))
vi.mock("@/lib/admin-auth", () => ({
  ADMIN_SESSION_COOKIE: "admin",
  getAdminSessionCookieOptions: vi.fn(async () => ({ secure: false })),
  getExpectedAdminSessionToken: vi.fn(async () => "expected"),
  verifyAdminCredentials: vi.fn(async (email: string, password: string) => email === "admin@example.com" && password === "secret"),
}))

import { loginAdmin } from "./admin-auth"

const form = (email: string, password: string) => {
  const data = new FormData()
  data.set("email", email)
  data.set("password", password)
  return data
}

describe("admin login integration contract", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com")
    vi.stubEnv("ADMIN_PASSWORD", "secret")
    vi.stubEnv("ADMIN_SECRET", "test-secret")
  })

  it("rejects invalid credentials", async () => {
    const result = await loginAdmin(undefined, form("admin@example.com", "wrong"))
    expect(result).toEqual({ error: "Incorrect email or password." })
  })

  it("sets an expiring httpOnly session and redirects on valid credentials", async () => {
    await expect(loginAdmin(undefined, form("admin@example.com", "secret"))).rejects.toThrow("REDIRECT")
    expect(cookieSet).toHaveBeenCalledWith("admin", "expected", expect.objectContaining({ httpOnly: true, maxAge: 8 * 60 * 60 }))
  })
})
