import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/lib/server/backend", () => ({
  proxyBackendRequest
}));

describe("verse_audio route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxies the verse audio request to the backend", async () => {
    const request = new Request("http://localhost/api/verse_audio?verse_key=1%3A1&recitation_id=7");
    const proxiedResponse = Response.json({ audio_url: "https://example.com/1-1.mp3" });
    proxyBackendRequest.mockResolvedValue(proxiedResponse);

    const { GET } = await import("./route");
    const response = await GET(request);

    expect(response).toBe(proxiedResponse);
    expect(proxyBackendRequest).toHaveBeenCalledWith(request, "/api/verse_audio");
  });
});
