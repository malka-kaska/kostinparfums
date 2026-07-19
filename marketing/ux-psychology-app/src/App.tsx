import { Suspense, lazy } from "react";

// Each feature is implemented by a subagent in its own folder under src/features/.
const InfiniteScroll = lazy(() => import("./features/infiniteScroll").then((m) => ({ default: m.InfiniteScroll })));
const VariableRewards = lazy(() => import("./features/variableRewards").then((m) => ({ default: m.VariableRewards })));
const Notifications = lazy(() => import("./features/notifications").then((m) => ({ default: m.Notifications })));
const Streaks = lazy(() => import("./features/streaks").then((m) => ({ default: m.Streaks })));
const PersonalizedFeed = lazy(() => import("./features/personalizedFeed").then((m) => ({ default: m.PersonalizedFeed })));
const Scarcity = lazy(() => import("./features/scarcity").then((m) => ({ default: m.Scarcity })));
const SocialProof = lazy(() => import("./features/socialProof").then((m) => ({ default: m.SocialProof })));
const Autoplay = lazy(() => import("./features/autoplay").then((m) => ({ default: m.Autoplay })));

const features: { title: string; subtitle: string; Comp: React.LazyExoticComponent<React.ComponentType> }[] = [
  { title: "1 · Infinite Scroll", subtitle: "Endless feed — no natural stopping point", Comp: InfiniteScroll },
  { title: "2 · Variable Rewards", subtitle: "Dopamine — unpredictable payout (slot-machine effect)", Comp: VariableRewards },
  { title: "3 · Notifications & Badges", subtitle: "Red badges create FOMO", Comp: Notifications },
  { title: "4 · Streaks & Daily Rewards", subtitle: "Fear of breaking the chain", Comp: Streaks },
  { title: "5 · Personalized Feed", subtitle: "Algorithm learns your behavior", Comp: PersonalizedFeed },
  { title: "6 · Scarcity & Urgency", subtitle: "Countdown & limited stock (FOMO)", Comp: Scarcity },
  { title: "7 · Social Proof", subtitle: "Likes & validation as reward", Comp: SocialProof },
  { title: "8 · Autoplay", subtitle: "Seamless next — no action required", Comp: Autoplay },
];

export default function App() {
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1>The UX Psychology Behind Apps People Can&apos;t Stop Using</h1>
        <p style={{ color: "#666" }}>
          Interactive demos of the 8 psychological hooks that make apps addictive. Built from the
          YouTube video <code>2TlIg3VokY8</code>.
        </p>
      </header>
      {features.map(({ title, subtitle, Comp }) => (
        <section
          key={title}
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>{title}</h2>
          <p style={{ color: "#888", marginTop: -8 }}>{subtitle}</p>
          <Suspense fallback={<p>Loading…</p>}>
            <Comp />
          </Suspense>
        </section>
      ))}
    </div>
  );
}
