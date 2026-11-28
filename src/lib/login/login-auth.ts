export function getLoginRedirectPath(role: string) {
  return role === "agency" || role === "developer" ? "/admin/users" : "/map";
}

export function mapApiRoleToLoginRole(role?: string | null) {
  if (role === "DEVELOPER") return "developer";
  return role === "AGENCY" ? "agency" : "resident";
}
