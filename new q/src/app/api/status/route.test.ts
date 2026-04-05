import { beforeEach, describe, expect, it, vi } from "vitest";

const getOfflineStatus = vi.fn();
const tryFetchBackendJson = vi.fn();

vi.mock("@/lib/server/offline-quran", () => ({
  getOfflineStatus
}));

vi.mock("@/lib/server/backend", () => ({
  tryFetchBackendJson
}));

describe("status route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the backend status when the FastAPI server responds", async () => {
    tryFetchBackendJson.mockResolvedValue({
      offline: false,
      rubs: 240,
      pages: 604,
      chapters: 114,
      current_rub: 9
    });

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      offline: false,
      rubs: 240,
      pages: 604,
      chapters: 114,
      current_rub: 9,
      backendAvailable: true
    });
    expect(getOfflineStatus).not.toHaveBeenCalled();
  });

  it("falls back to offline status when the backend is unavailable", async () => {
    tryFetchBackendJson.mockResolvedValue(null);
    getOfflineStatus.mockResolvedValue({
      offline: true,
      rubs: 240,
      pages: 604,
      chapters: 114,
      current_rub: 1,
      backendAvailable: false
    });

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      offline: true,
      rubs: 240,
      pages: 604,
      chapters: 114,
      current_rub: 1,
      backendAvailable: false
    });
    expect(getOfflineStatus).toHaveBeenCalledTimes(1);
  });
});
