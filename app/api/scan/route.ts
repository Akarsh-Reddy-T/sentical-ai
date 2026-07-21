import { NextResponse } from "next/server";
import { scanCode } from "@/lib/security/scanner";

const MAX_BODY_BYTES = 200_000;
const MAX_CODE_CHARACTERS = 150_000;

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return response({ error: "Content-Type must be application/json." }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return response({ error: "Request body is too large." }, 413);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return response({ error: "Unable to read request body." }, 400);
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return response({ error: "Request body is too large." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return response({ error: "Request body must contain valid JSON." }, 400);
  }

  if (!body || typeof body !== "object" || !("code" in body) || typeof body.code !== "string") {
    return response({ error: "A string field named code is required." }, 422);
  }

  if (body.code.length === 0 || body.code.length > MAX_CODE_CHARACTERS) {
    return response({ error: `Code must contain between 1 and ${MAX_CODE_CHARACTERS} characters.` }, 422);
  }

  return response(scanCode(body.code));
}
