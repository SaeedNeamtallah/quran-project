const DEFAULT_BACKEND_URL = "http://127.0.0.1:8080";

interface ProxyBackendOptions {
  headers?: HeadersInit;
}

export function getBackendBaseUrl() {
  return (process.env.FASTAPI_BASE_URL || DEFAULT_BACKEND_URL).replace(/\/$/, "");
}

export async function fetchBackend(pathname: string, init?: RequestInit) {
  const target = new URL(pathname, `${getBackendBaseUrl()}/`);
  return fetch(target, {
    ...init,
    cache: "no-store"
  });
}

export async function tryFetchBackendJson<T>(pathname: string, init?: RequestInit) {
  try {
    const response = await fetchBackend(pathname, init);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function proxyBackendRequest(request: Request, pathname: string, options?: ProxyBackendOptions) {
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(pathname, `${getBackendBaseUrl()}/`);
  targetUrl.search = incomingUrl.search;
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", request.headers.get("content-type") || "application/json");

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store"
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  try {
    const response = await fetch(targetUrl, init);
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8"
      }
    });
  } catch {
    return Response.json(
      {
        detail: "تعذر الاتصال بالسيرفر المحلي الحالي."
      },
      { status: 503 }
    );
  }
}
