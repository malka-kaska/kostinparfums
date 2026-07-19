import { useState } from "react";

type Tier = "none" | "small" | "medium" | "big" | "rare";

const TIERS: { tier: Tier; label: string; weight: number }[] = [
  { tier: "small", label: "+10 points", weight: 50 },
  { tier: "medium", label: "+50 points", weight: 30 },
  { tier: "big", label: "+200 points", weight: 15 },
  { tier: "rare", label: "★ JACKPOT +1000 points", weight: 5 },
];

function pickTier(): Tier {
  const total = TIERS.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of TIERS) {
    r -= t.weight;
    if (r <= 0) return t.tier;
  }
  return "small";
}

export function VariableRewards() {
  const [last, setLast] = useState<Tier>("none");
  const [opens, setOpens] = useState(0);
  const [total, setTotal] = useState(0);

  const open = () => {
    const tier = pickTier();
    const gained = { none: 0, small: 10, medium: 50, big: 200, rare: 1000 }[tier];
    setLast(tier);
    setOpens((o) => o + 1);
    setTotal((t) => t + gained);
  };

  const label = TIERS.find((t) => t.tier === last)?.label ?? "Open to reveal";

  return (
    <div>
      <button onClick={open} data-testid="open">
        Open
      </button>
      <p data-testid="reward">{label}</p>
      <p data-testid="stats">Opens: {opens} · Total: {total}</p>
    </div>
  );
}

export default VariableRewards;
