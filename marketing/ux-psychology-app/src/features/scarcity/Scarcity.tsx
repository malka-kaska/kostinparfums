import { useEffect, useState } from "react";

const DURATION = 10; // seconds

export function Scarcity() {
  const [remaining, setRemaining] = useState(DURATION);
  const [stock, setStock] = useState(5);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (expired) return;
    const t = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(t);
          setExpired(true);
          return 0;
        }
        return r - 1;
      });
      setStock((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [expired]);

  return (
    <div>
      <p data-testid="timer">
        {expired ? "Offer expired" : `${remaining}s left`}
      </p>
      <p data-testid="stock">{stock} left</p>
      <button disabled={expired} data-testid="buy">
        Buy now
      </button>
    </div>
  );
}

export default Scarcity;
