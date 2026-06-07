import { cn } from "@/lib/utils";

interface ScoreButtonProps {
  score: number;
  selected: boolean;
  onClick: () => void;
  "data-testid"?: string;
}

const SCORE_CONFIG = {
  0: { bg: "#FF3B30", label: "0", desc: "Нет" },
  1: { bg: "#FF9500", label: "1", desc: "Частично" },
  2: { bg: "#FFD60A", label: "2", desc: "Хорошо" },
  3: { bg: "#34C759", label: "3", desc: "Отлично" },
} as const;

export function ScoreButton({ score, selected, onClick, "data-testid": testId }: ScoreButtonProps) {
  const config = SCORE_CONFIG[score as keyof typeof SCORE_CONFIG];

  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 h-[72px] w-full rounded-[18px] transition-all duration-150 active:scale-95"
      style={{
        background: selected ? config.bg : `${config.bg}18`,
        boxShadow: selected
          ? `0 4px 16px ${config.bg}50`
          : "none",
        transform: selected ? "scale(1.04)" : "scale(1)",
      }}
    >
      <span
        className="text-[22px] font-bold"
        style={{ color: selected ? "#fff" : config.bg }}
      >
        {config.label}
      </span>
      <span
        className="text-[10px] font-medium"
        style={{ color: selected ? "rgba(255,255,255,0.85)" : config.bg }}
      >
        {config.desc}
      </span>
    </button>
  );
}
