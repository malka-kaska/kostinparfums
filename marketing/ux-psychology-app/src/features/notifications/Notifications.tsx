import { useState } from "react";

type Note = { id: number; text: string };

const SAMPLES = [
  "New comment on your post",
  "Someone mentioned you",
  "Your order shipped",
  "Weekly summary ready",
];

let nextId = 1;

export function Notifications() {
  const [count, setCount] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);

  const addNote = () =>
    setNotes((prev) => {
      const n = { id: nextId++, text: SAMPLES[prev.length % SAMPLES.length] };
      setCount((c) => c + 1);
      return [n, ...prev];
    });

  const readAll = () => {
    setCount(0);
  };

  return (
    <div>
      <button onClick={addNote} data-testid="add">
        New notification
      </button>
      <button onClick={readAll} data-testid="read">
        Mark all read
      </button>
      <span
        data-testid="badge"
        style={{
          background: count > 0 ? "#e0245e" : "transparent",
          color: "#fff",
          borderRadius: 10,
          padding: "2px 8px",
          marginLeft: 8,
        }}
      >
        {count > 0 ? count : ""}
      </span>
      <ul data-testid="list">
        {notes.map((n) => (
          <li key={n.id}>{n.text}</li>
        ))}
      </ul>
    </div>
  );
}

export default Notifications;
