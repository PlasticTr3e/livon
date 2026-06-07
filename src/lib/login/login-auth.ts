export function getLoginRedirectPath(role: string) {
  return role === "agency" ? "/admin/users" : "/map";
}

export function mapApiRoleToLoginRole(role?: string | null) {
  return role === "WARGA" ? "resident" : "agency";
}
