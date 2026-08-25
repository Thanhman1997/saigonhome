import { beforeEach, describe, expect, it, vi } from "vitest"

const cookieValue = vi.hoisted(() => ({ value: "valid-token" }))
const putMock = vi.hoisted(() => vi.fn().mockResolvedValue({ url: "https://blob.test/image.png" }))

vi.mock("@vercel/blob", () => ({ put: putMock }))
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: () => ({ value: cookieValue.value }) })) }))
vi.mock("@/lib/admin-auth", () => ({
  ADMIN_SESSION_COOKIE: "admin",
  getExpectedAdminSessionToken: vi.fn(async () => "valid-token"),
}))

import { POST } from "./route"

function requestWith(file: File | null) {
  const form = new FormData()
  if (file) form.set("file", file)
  return new Request("http://localhost/api/admin/upload", { method: "POST", body: form })
}

describe("admin upload integration contract", () => {
  beforeEach(() => { putMock.mockClear(); cookieValue.value = "valid-token" })

  it("rejects unauthenticated uploads", async () => {
    cookieValue.value = "wrong-token"
    const response = await POST(requestWith(new File(["x"], "x.png", { type: "image/png" })) as never)
    expect(response.status).toBe(401)
  })

  it("rejects non-image files", async () => {
    const response = await POST(requestWith(new File(["x"], "x.txt", { type: "text/plain" })) as never)
    expect(response.status).toBe(400)
    expect(putMock).not.toHaveBeenCalled()
  })

  it("rejects a MIME-spoofed file", async () => {
    const response = await POST(requestWith(new File(["not-an-image"], "fake.png", { type: "image/png" })) as never)
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid image file" })
    expect(putMock).not.toHaveBeenCalled()
  })

  it("rejects files over 8MB", async () => {
    const response = await POST(requestWith(new File([new Uint8Array(8 * 1024 * 1024 + 1)], "large.png", { type: "image/png" })) as never)
    expect(response.status).toBe(400)
    expect(putMock).not.toHaveBeenCalled()
  })

  it("uploads an authorized image", async () => {
    const response = await POST(requestWith(new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "image.png", { type: "image/png" })) as never)
    expect(response.status).toBe(200)
    expect(putMock).toHaveBeenCalledOnce()
  })
})
