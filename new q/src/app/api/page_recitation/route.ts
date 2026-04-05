import { proxyBackendRequest } from "@/lib/server/backend";

export async function GET(request: Request) {
  return proxyBackendRequest(request, "/api/page_recitation");
}
