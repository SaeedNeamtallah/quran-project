import { getOfflineStatus } from "@/lib/server/offline-quran";
import { tryFetchBackendJson } from "@/lib/server/backend";
import type { AppStatusPayload } from "@/lib/types/quran";

export async function GET() {
  const backendStatus = await tryFetchBackendJson<AppStatusPayload>("/api/status");
  if (backendStatus) {
    return Response.json({
      ...backendStatus,
      backendAvailable: true
    });
  }

  const offlineStatus = await getOfflineStatus();
  return Response.json(offlineStatus);
}
