import { useEffect, useRef, useState } from "react";

const CLIPS = ["Intro", "Deep Dive", "Case Study", "Wrap Up"];
const CLIP_MS = 2000;

export function Autoplay() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || !autoplay) return;
    timer.current = window.setTimeout(() => {
      setIdx((i) => (i + 1) % CLIPS.length);
    }, CLIP_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, autoplay, idx]);

  const onEnded = () => {
    if (autoplay) setIdx((i) => (i + 1) % CLIPS.length);
  };

  return (
    <div>
      <p data-testid="current">Now playing: {CLIPS[idx]}</p>
      <p data-testid="next">Next: {CLIPS[(idx + 1) % CLIPS.length]}</p>
      <button onClick={() => setPlaying((p) => !p)} data-testid="play">
        {playing ? "Pause" : "Play"}
      </button>
      <button
        onClick={() => {
          setPlaying(false);
          onEnded();
        }}
        data-testid="ended"
      >
        End clip
      </button>
      <label>
        <input
          type="checkbox"
          checked={autoplay}
          onChange={(e) => setAutoplay(e.target.checked)}
          data-testid="autoplay-toggle"
        />
        Autoplay
      </label>
    </div>
  );
}

export default Autoplay;
