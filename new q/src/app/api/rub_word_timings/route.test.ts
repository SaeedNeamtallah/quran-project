import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/lib/server/backend", () => ({
  proxyBackendRequest
}));

describe("rub_word_timings route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxies the rub word timings request to the backend", async () => {
    const request = new Request("http://localhost/api/rub_word_timings?rub_number=1&count=1&recitation_id=7");
    const proxiedResponse = Response.json({ word_timings: {} });
    proxyBackendRequest.mockResolvedValue(proxiedResponse);

    const { GET } = await import("./route");
    const response = await GET(request);

    expect(response).toBe(proxiedResponse);
    expect(proxyBackendRequest).toHaveBeenCalledWith(request, "/api/rub_word_timings");
  });
});
