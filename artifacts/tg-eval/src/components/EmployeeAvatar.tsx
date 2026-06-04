import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface EmployeeAvatarProps {
  name: string;
  className?: string;
}

export function EmployeeAvatar({ name, className }: EmployeeAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Generate a consistent color based on the name
  const colors = [
    "bg-red-100 text-red-700",
    "bg-orange-100 text-orange-700",
    "bg-amber-100 text-amber-700",
    "bg-green-100 text-green-700",
    "bg-emerald-100 text-emerald-700",
    "bg-teal-100 text-teal-700",
    "bg-cyan-100 text-cyan-700",
    "bg-sky-100 text-sky-700",
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-purple-100 text-purple-700",
    "bg-fuchsia-100 text-fuchsia-700",
    "bg-pink-100 text-pink-700",
    "bg-rose-100 text-rose-700",
  ];

  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colorIndex = hash % colors.length;
  const colorClass = colors[colorIndex];

  return (
    <Avatar className={cn("h-12 w-12 border border-border/50", className)}>
      <AvatarFallback className={cn("font-medium", colorClass)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
