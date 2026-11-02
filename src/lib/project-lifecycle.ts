export const PROJECT_STAGES = [
  "Planning",
  "Under Construction",
  "Completed",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

// Legacy approved/funding projects stay in planning until construction starts.
// This adapts existing API values without rewriting stored project statuses.
export function getProjectStage(status?: string): ProjectStage {
  switch (status) {
    case "BERJALAN":
    case "KONSTRUKSI":
    case "Construction":
    case "Under Construction":
      return "Under Construction";
    case "SELESAI":
    case "Completed":
      return "Completed";
    default:
      return "Planning";
  }
}

export const PROJECT_STAGE_API_STATUS: Record<ProjectStage, string> = {
  Planning: "USULAN",
  "Under Construction": "BERJALAN",
  Completed: "SELESAI",
};
