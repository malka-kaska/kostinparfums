import { useState } from "react";

const DAYS = 7;

export function Streaks() {
  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState<boolean[]>(Array(DAYS).fill(false));

  const checkIn = () => {
    setStreak((s) => {
      const ns = s + 1;
      setWeek((w) => {
        const copy = [...w];
        copy[Math.min(ns - 1, DAYS - 1)] = true;
        return copy;
      });
      return ns;
    });
  };

  const reset = () => {
    setStreak(0);
    setWeek(Array(DAYS).fill(false));
  };

  return (
    <div>
      <p data-testid="streak">Streak: {streak} days</p>
      <div data-testid="week" style={{ display: "flex", gap: 4 }}>
        {week.map((done, i) => (
          <span
            key={i}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              display: "inline-block",
              background: done ? "#2ecc71" : "#eee",
            }}
          />
        ))}
      </div>
      <button onClick={checkIn} data-testid="checkin">
        Daily Check-in
      </button>
      <button onClick={reset} data-testid="reset">
        Skip / Reset
      </button>
    </div>
  );
}

export default Streaks;
