import { queryOptions } from "@tanstack/react-query";

import { fetchAppStatus } from "@/lib/api/client";

export function getAppStatusQueryOptions() {
  return queryOptions({
    queryKey: ["app-status"],
    queryFn: fetchAppStatus,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: (query) => (query.state.data?.backendAvailable ? false : 5_000)
  });
}
