export const PROJECT_ADDRESS_MAX_LENGTH = 200;

export function formatProjectAddress(project: {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const address = project.address?.trim();
  if (address) return address;

  const { latitude, longitude } = project;
  if (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude)
  ) {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  return "-";
}
