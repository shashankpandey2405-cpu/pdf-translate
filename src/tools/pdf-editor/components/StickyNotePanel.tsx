import { useState } from "react";

interface Props {
  onAdd: (note: { text: string; color: string }) => void;
  onClose: () => void;
}

const NOTE_COLORS = ["#FFEB3B", "#4CAF50", "#2196F3", "#E91E63", "#FF9800"];

export function StickyNotePanel({ onAdd, onClose }: Props) {
  const [text, setText] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0]);

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd({ text, color });
    setText("");
    onClose();
  };

  return (
    <div className="absolute bottom-4 right-4 z-30 bg-card border border-border rounded-xl p-4 shadow-xl w-72">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">📝 Sticky Note</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
          ✕
        </button>
      </div>

      <div className="flex gap-1 mb-3">
        {NOTE_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              color === c ? "border-foreground scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your note..."
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <button
        onClick={handleAdd}
        disabled={!text.trim()}
        className="mt-2 w-full px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        Add Note
      </button>
    </div>
  );
}
