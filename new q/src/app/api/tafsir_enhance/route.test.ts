import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/lib/server/backend", () => ({
  proxyBackendRequest
}));

describe("tafsir_enhance route handler", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.TAFSIR_ENHANCE_SHARED_SECRET;
    delete process.env.TAFSIR_ENHANCE_MAX_TEXT_LENGTH;
    delete process.env.TAFSIR_ENHANCE_RATE_LIMIT_WINDOW_SECONDS;
    delete process.env.TAFSIR_ENHANCE_RATE_LIMIT_MAX_REQUESTS;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for invalid json payloads", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/tafsir_enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: "{"
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      detail: "جسم الطلب غير صالح."
    });
    expect(proxyBackendRequest).not.toHaveBeenCalled();
  });

  it("returns 413 when the plain text exceeds the configured limit", async () => {
    process.env.TAFSIR_ENHANCE_MAX_TEXT_LENGTH = "2000";
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/tafsir_enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: "س".repeat(2001)
        })
      })
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      detail: "نص التفسير أطول من الحد المسموح (2000 حرفًا)."
    });
    expect(proxyBackendRequest).not.toHaveBeenCalled();
  });

  it("rate limits repeated requests from the same client ip", async () => {
    process.env.TAFSIR_ENHANCE_RATE_LIMIT_MAX_REQUESTS = "1";
    process.env.TAFSIR_ENHANCE_RATE_LIMIT_WINDOW_SECONDS = "60";
    proxyBackendRequest.mockResolvedValue(Response.json({ ok: true }));

    const { POST } = await import("./route");
    const request = () =>
      new Request("http://localhost/api/tafsir_enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.10"
        },
        body: JSON.stringify({
          text: "نص قصير"
        })
      });

    const firstResponse = await POST(request());
    const secondResponse = await POST(request());

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(429);
    await expect(secondResponse.json()).resolves.toMatchObject({
      detail: "تم تجاوز حد طلبات تحسين التفسير. حاول مرة أخرى بعد 60 ثانية."
    });
  });

  it("forwards the shared secret to the backend proxy when configured", async () => {
    process.env.TAFSIR_ENHANCE_SHARED_SECRET = "super-secret";
    proxyBackendRequest.mockResolvedValue(Response.json({ ok: true }));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/tafsir_enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: "نص صالح"
        })
      })
    );

    expect(response.status).toBe(200);
    expect(proxyBackendRequest).toHaveBeenCalledTimes(1);
    expect(proxyBackendRequest).toHaveBeenCalledWith(
      expect.any(Request),
      "/api/tafsir_enhance",
      {
        headers: {
          "x-tafsir-enhance-secret": "super-secret"
        }
      }
    );
  });
});
