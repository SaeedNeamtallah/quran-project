import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/lib/server/backend", () => ({
  proxyBackendRequest
}));

describe("recitations route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("proxies the recitations request to the backend", async () => {
    const request = new Request("http://localhost/api/recitations");
    const proxiedResponse = Response.json({ recitations: [] });
    proxyBackendRequest.mockResolvedValue(proxiedResponse);

    const { GET } = await import("./route");
    const response = await GET(request);

    expect(response).toBe(proxiedResponse);
    expect(proxyBackendRequest).toHaveBeenCalledWith(request, "/api/recitations");
  });
});
