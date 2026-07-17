import { useEffect, useRef, useState } from "react";

const PAGE_SIZE = 10;

function makeItem(n: number): string {
  return `Item #${n} — endless feed keeps you scrolling`;
}

export function InfiniteScroll() {
  const [items, setItems] = useState<string[]>(() =>
    Array.from({ length: PAGE_SIZE }, (_, i) => makeItem(i + 1))
  );
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) {
        setLoading(true);
        // simulate async fetch
        window.setTimeout(() => {
          setItems((prev) =>
            prev.concat(
              Array.from({ length: PAGE_SIZE }, (_, i) => makeItem(prev.length + i + 1))
            )
          );
          setLoading(false);
        }, 400);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  return (
    <div>
      <p data-testid="count">Loaded: {items.length} items</p>
      <ul style={{ maxHeight: 240, overflowY: "auto", border: "1px solid #eee", padding: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ padding: 6, borderBottom: "1px solid #f5f5f5" }}>
            {it}
          </li>
        ))}
        <div ref={sentinelRef} data-testid="sentinel" style={{ height: 1 }} />
      </ul>
      {loading && <p>Loading more…</p>}
    </div>
  );
}

export default InfiniteScroll;
