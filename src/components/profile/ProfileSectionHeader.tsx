type ProfileSectionHeaderProps = {
  description: string;
  title: string;
};

export function ProfileSectionHeader({
  description,
  title,
}: ProfileSectionHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </h1>
      <p className="mt-1 text-sm text-gray-400 dark:text-white">
        {description}
      </p>
    </div>
  );
}
