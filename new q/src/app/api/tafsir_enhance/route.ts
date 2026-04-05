import { proxyBackendRequest } from "@/lib/server/backend";

const MAX_TEXT_LENGTH = clampEnvInt(process.env.TAFSIR_ENHANCE_MAX_TEXT_LENGTH, 12000, 2000, 50000);
const RATE_LIMIT_WINDOW_SECONDS = clampEnvInt(process.env.TAFSIR_ENHANCE_RATE_LIMIT_WINDOW_SECONDS, 60, 10, 3600);
const RATE_LIMIT_MAX_REQUESTS = clampEnvInt(process.env.TAFSIR_ENHANCE_RATE_LIMIT_MAX_REQUESTS, 8, 1, 200);

const enhanceRequestLog = new Map<string, number[]>();

function clampEnvInt(rawValue: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(String(rawValue ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  if (forwardedFor) return forwardedFor;
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

function exceedsRateLimit(clientIp: string) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_SECONDS * 1000;
  const recent = (enhanceRequestLog.get(clientIp) ?? []).filter((stamp) => stamp >= cutoff);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    enhanceRequestLog.set(clientIp, recent);
    return true;
  }
  recent.push(now);
  enhanceRequestLog.set(clientIp, recent);
  return false;
}

export async function POST(request: Request) {
  let payload: { text?: unknown } | null = null;

  try {
    payload = (await request.clone().json()) as { text?: unknown };
  } catch {
    return Response.json(
      {
        detail: "جسم الطلب غير صالح."
      },
      { status: 400 }
    );
  }

  const text = typeof payload?.text === "string" ? payload.text.trim() : "";
  if (!text) {
    return Response.json(
      {
        detail: "لا يوجد نص تفسير صالح للتحسين"
      },
      { status: 400 }
    );
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return Response.json(
      {
        detail: `نص التفسير أطول من الحد المسموح (${MAX_TEXT_LENGTH} حرفًا).`
      },
      { status: 413 }
    );
  }

  const clientIp = getClientIp(request);
  if (exceedsRateLimit(clientIp)) {
    return Response.json(
      {
        detail: `تم تجاوز حد طلبات تحسين التفسير. حاول مرة أخرى بعد ${RATE_LIMIT_WINDOW_SECONDS} ثانية.`
      },
      { status: 429 }
    );
  }

  const secret = process.env.TAFSIR_ENHANCE_SHARED_SECRET?.trim();

  return proxyBackendRequest(request, "/api/tafsir_enhance", {
    headers: secret
      ? {
          "x-tafsir-enhance-secret": secret
        }
      : undefined
  });
}
