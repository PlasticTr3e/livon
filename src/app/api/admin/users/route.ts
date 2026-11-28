import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { canAccessSensitiveResidentData } from "@/lib/permissions";
import { getAdminUsersPageData } from "@/lib/admin-users/admin-users-data";

export async function GET(request: NextRequest) {
  const actor = await getAuthUser(request);
  if (!actor || !canAccessSensitiveResidentData(actor.role)) {
    return Response.json(
      { message: "Forbidden" },
      { status: actor ? 403 : 401 },
    );
  }

  const { searchParams } = request.nextUrl;
  return Response.json(
    await getAdminUsersPageData({
      filter: searchParams.get("filter") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    }),
    { headers: { "Cache-Control": "no-store" } },
  );
}
