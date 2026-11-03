export type UserProfileNameSource = {
  name?: string | null;
  email?: string | null;
  citizenProfile?: { fullName?: string | null } | null;
  agencyProfile?: { agencyName?: string | null } | null;
};

export function getUserInitial(userName: string) {
  return userName.charAt(0).toUpperCase();
}

export function getUserHeaderDisplayName(userName: string, userRole?: string) {
  if (!userName || userName.includes("@")) return "User";
  if (isAgencyRole(userRole)) return userName.trim();

  const nameParts = userName.trim().split(/\s+/).filter(Boolean);
  const [firstName, ...remainingNames] = nameParts;

  if (!firstName) return "User";
  if (remainingNames.length === 0) return firstName;
  if (remainingNames.every(isInitialGroup)) return userName.trim();

  const initials = remainingNames
    .map((name) => name.charAt(0).toUpperCase())
    .filter(Boolean)
    .join(".");

  return initials ? `${firstName} ${initials}` : firstName;
}

function isInitialGroup(name: string) {
  return /^[A-Z](?:\.[A-Z])+\.?$/i.test(name);
}

function isAgencyRole(userRole?: string) {
  const normalizedRole = userRole?.toUpperCase();
  return (
    normalizedRole === "ADMIN" ||
    normalizedRole === "AGENCY" ||
    normalizedRole === "DEVELOPER"
  );
}

export function getUserProfileDisplayName(
  user?: UserProfileNameSource | null,
  fallback = "User",
  userRole?: string,
) {
  const profileName =
    user?.citizenProfile?.fullName || user?.agencyProfile?.agencyName;
  const accountName = user?.name && !user.name.includes("@") ? user.name : "";
  const role = userRole || (user?.agencyProfile ? "admin" : undefined);

  return getUserHeaderDisplayName(profileName || accountName || fallback, role);
}

export function getUserAvatarClassName(userRole: string) {
  const r = userRole?.toLowerCase();
  if (r === "admin" || r === "agency") {
    return "bg-gradient-to-br from-blue-400 to-blue-600 text-white";
  }
  if (r === "developer") {
    return "bg-gradient-to-br from-purple-500 to-purple-700 text-white";
  }
  return "bg-gradient-to-br from-green-500 to-green-700 text-white";
}

export function getUserRoleLabel(userRole: string) {
  const r = userRole?.toLowerCase();
  if (r === "admin" || r === "agency") return "Admin";
  if (r === "developer") return "Developer";
  return "Resident";
}
