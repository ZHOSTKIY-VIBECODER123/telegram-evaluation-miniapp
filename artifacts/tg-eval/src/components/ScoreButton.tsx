interface ScoreButtonProps {
  score: number;
  selected: boolean;
  onClick: () => void;
  "data-testid"?: string;
}

const SCORE_CONFIG = {
  0: { bg: "#FF3B30" },
  1: { bg: "#FF9500" },
  2: { bg: "#FFD60A" },
  3: { bg: "#34C759" },
} as const;

export function ScoreButton({ score, selected, onClick, "data-testid": testId }: ScoreButtonProps) {
  const config = SCORE_CONFIG[score as keyof typeof SCORE_CONFIG];

  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className="h-[60px] w-full rounded-[18px] transition-all duration-150 active:scale-95 flex items-center justify-center"
      style={{
        background: selected ? config.bg : `${config.bg}18`,
        boxShadow: selected ? `0 4px 16px ${config.bg}50` : "none",
        transform: selected ? "scale(1.04)" : "scale(1)",
      }}
    >
      <span
        className="text-[24px] font-bold"
        style={{ color: selected ? (score === 2 ? "#000" : "#fff") : config.bg }}
      >
        {score}
      </span>
    </button>
  );
}
