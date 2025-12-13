import { getInitials } from "../utils/birthdayDate";

export function BirthdayAvatar(props: {
  name: string;
  avatarUrl?: string | null;
  variant: "today" | "upcoming";
}) {
  const { name, avatarUrl, variant } = props;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-sm"
      />
    );
  }

  const colorClass =
    variant === "today"
      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
      : "bg-[#1282A2] text-white";

  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}>
      {getInitials(name)}
    </div>
  );
}
