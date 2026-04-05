import { beforeEach, describe, expect, it, vi } from "vitest";

describe("set_rub route handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.FASTAPI_BASE_URL;
  });

  it("forwards POST bodies to the FastAPI backend", async () => {
    process.env.FASTAPI_BASE_URL = "http://backend.example:8080";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "ok", current_rub: 12 }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/set_rub", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        rub_number: 12
      })
    });

    const response = await POST(request);

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://backend.example:8080/api/set_rub"),
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({
          rub_number: 12
        })
      })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "ok",
      current_rub: 12
    });
  });
});
