import { beforeEach, describe, expect, it, vi } from "vitest";

describe("rub route handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.FASTAPI_BASE_URL;
  });

  it("proxies GET requests to the FastAPI backend with the original query string", async () => {
    process.env.FASTAPI_BASE_URL = "http://backend.example:8080";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ rub_number: 5, verses: [] }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/rub?count=3"));

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://backend.example:8080/api/rub?count=3"),
      expect.objectContaining({
        method: "GET",
        cache: "no-store"
      })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      rub_number: 5,
      verses: []
    });
  });

  it("returns a 503 payload when the backend fetch throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/rub?count=2"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      detail: "تعذر الاتصال بالسيرفر المحلي الحالي."
    });
  });
});
