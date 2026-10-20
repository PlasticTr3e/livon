import { NextRequest } from "next/server";
import { ok } from "@/lib/api-response";
import { getAuthUser, revokeToken } from "@/lib/auth";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Revokes the bearer token so it can no longer be used, even before it expires.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out (also returned when the token was already invalid)
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (authUser) {
    try {
      await revokeToken(authUser);
    } catch (error) {
      console.warn("Token revocation failed during logout", error);
    }
  }
  return ok("Logged out");
}
