import type { ProfileRole, UserWithProfile } from "./profile-types";

export function getProfileRole(user: UserWithProfile): ProfileRole {
  return user.role === "WARGA" && !user.agencyProfile ? "resident" : "agency";
}

export function getProfileRoleLabel(profileRole: ProfileRole) {
  return profileRole === "agency" ? "Agency" : "Resident";
}

export function getProfileDisplayName(
  user: UserWithProfile,
  profileRole: ProfileRole,
) {
  if (profileRole === "agency") {
    return user.agencyProfile?.agencyName || "Administrator";
  }

  return user.citizenProfile?.fullName || user.name || "";
}

export function mergeUpdatedProfile(
  currentUser: UserWithProfile,
  updatedProfile: Partial<UserWithProfile>,
) {
  const nextUser = { ...currentUser };

  if (currentUser.citizenProfile) {
    nextUser.citizenProfile = {
      ...currentUser.citizenProfile,
      ...updatedProfile,
    };
  } else if (currentUser.agencyProfile) {
    nextUser.agencyProfile = {
      ...currentUser.agencyProfile,
      ...updatedProfile,
    };
  }

  if (updatedProfile.email) nextUser.email = updatedProfile.email;
  if (updatedProfile.role) nextUser.role = updatedProfile.role;

  return nextUser;
}
