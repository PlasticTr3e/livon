export function getUserInitial(userName: string) {
  return userName.charAt(0).toUpperCase();
}

export function getUserAvatarClassName(userRole: string) {
  return userRole === "agency"
    ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
    : "bg-gradient-to-br from-green-500 to-green-700 text-white";
}

export function getUserRoleLabel(userRole: string) {
  return userRole === "agency" ? "Agency" : "Resident";
}
