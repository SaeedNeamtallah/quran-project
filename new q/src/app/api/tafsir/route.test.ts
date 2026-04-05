import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/lib/server/backend", () => ({
  proxyBackendRequest
}));

describe("tafsir route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxies the tafsir request to the backend", async () => {
    const request = new Request("http://localhost/api/tafsir?verse_key=2%3A255&tafsir_id=926");
    const proxiedResponse = Response.json({ verse_key: "2:255" });
    proxyBackendRequest.mockResolvedValue(proxiedResponse);

    const { GET } = await import("./route");
    const response = await GET(request);

    expect(response).toBe(proxiedResponse);
    expect(proxyBackendRequest).toHaveBeenCalledWith(request, "/api/tafsir");
  });
});
