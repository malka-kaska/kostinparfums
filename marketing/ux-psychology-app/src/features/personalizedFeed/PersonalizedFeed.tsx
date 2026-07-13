import { useMemo, useState } from "react";

type Card = { id: number; category: string };

const CATEGORIES = ["music", "sports", "tech", "food", "travel"];
const POOL: Card[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  category: CATEGORIES[i % CATEGORIES.length],
}));

export function PersonalizedFeed() {
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c, 1]))
  );
  const [queue, setQueue] = useState<Card[]>(POOL);

  const ranked = useMemo(() => {
    return [...queue].sort(
      (a, b) => (weights[b.category] ?? 1) - (weights[a.category] ?? 1)
    );
  }, [queue, weights]);

  const react = (card: Card, liked: boolean) => {
    setQueue((q) => q.filter((c) => c.id !== card.id));
    if (liked) {
      setWeights((w) => ({ ...w, [card.category]: (w[card.category] ?? 1) + 2 }));
    }
  };

  const top = useMemo(
    () =>
      [...CATEGORIES]
        .sort((a, b) => (weights[b] ?? 1) - (weights[a] ?? 1))
        .slice(0, 3),
    [weights]
  );

  return (
    <div>
      <p data-testid="top">Top: {top.join(", ")}</p>
      <ul data-testid="feed">
        {ranked.slice(0, 5).map((c) => (
          <li key={c.id} data-testid={`card-${c.category}`}>
            {c.category}{" "}
            <button onClick={() => react(c, true)}>interested</button>{" "}
            <button onClick={() => react(c, false)}>not</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PersonalizedFeed;
