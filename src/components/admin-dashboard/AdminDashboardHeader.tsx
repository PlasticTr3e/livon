export function AdminDashboardHeader() {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white">
          Summary of statistics and performance of the LIVON platform.
        </p>
      </div>
    </div>
  );
}
