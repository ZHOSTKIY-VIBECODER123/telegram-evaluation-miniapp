import { cn } from "@/lib/utils";

interface ScoreButtonProps {
  score: number;
  selected: boolean;
  onClick: () => void;
  "data-testid"?: string;
}

export function ScoreButton({ score, selected, onClick, "data-testid": testId }: ScoreButtonProps) {
  const colors = {
    0: "bg-[#EF4444] text-white border-[#EF4444]",
    1: "bg-[#F97316] text-white border-[#F97316]",
    2: "bg-[#EAB308] text-white border-[#EAB308]",
    3: "bg-[#22C55E] text-white border-[#22C55E]",
  };

  const selectedColors = {
    0: "ring-2 ring-offset-2 ring-[#EF4444]",
    1: "ring-2 ring-offset-2 ring-[#F97316]",
    2: "ring-2 ring-offset-2 ring-[#EAB308]",
    3: "ring-2 ring-offset-2 ring-[#22C55E]",
  };

  const defaultColors = {
    0: "text-[#EF4444] border-[#EF4444] bg-white",
    1: "text-[#F97316] border-[#F97316] bg-white",
    2: "text-[#EAB308] border-[#EAB308] bg-white",
    3: "text-[#22C55E] border-[#22C55E] bg-white",
  };

  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center min-h-[44px] w-full rounded-xl border-2 font-bold text-lg transition-all",
        selected
          ? cn(colors[score as keyof typeof colors], selectedColors[score as keyof typeof selectedColors])
          : defaultColors[score as keyof typeof defaultColors]
      )}
    >
      {score}
    </button>
  );
}
