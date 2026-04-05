import { readOfflineQuranData } from "@/lib/server/offline-quran";

export async function GET() {
  const payload = await readOfflineQuranData();
  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
