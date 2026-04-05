import { proxyBackendRequest } from "@/lib/server/backend";

export async function POST(request: Request) {
  return proxyBackendRequest(request, "/api/set_rub");
}
