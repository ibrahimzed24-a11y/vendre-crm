import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { globalSearch } from "@/services/search.service";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthenticatedWorkspaceContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const results = await globalSearch(ctx.workspace.id, query);
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
