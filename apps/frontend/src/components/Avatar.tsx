interface AvatarProps {
  name?: string;
  className?: string;
}

const Avatar = ({ name, className = '' }: AvatarProps) => {
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold uppercase text-white shadow ${className}`}
    >
      {initials}
    </span>
  );
};

export default Avatar;
