import { NextResponse } from "next/server";
import { requireTeaserApiSession } from "@/lib/teasers/api-auth";
import { readTeaserDashboard } from "@/lib/teasers/dashboard";

export async function GET(request: Request) {
  const auth = requireTeaserApiSession(request);
  if (auth.response) return auth.response;
  return NextResponse.json(await readTeaserDashboard());
}
