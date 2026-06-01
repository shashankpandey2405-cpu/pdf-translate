import { useState, useCallback, useRef, useEffect } from "react";
import { configurePdfJsWorker } from "@/lib/configurePdfJsWorker";
import type { TextItemPosition } from "../types";

interface Props {
  file: File;
  pageNumber: number;
  onEdit: (page: number, edits: { index: number; newText: string }[]) => void;
}

export function TextEditorOverlay({
  file,
  pageNumber,
  onEdit,
}: Props) {
  const [textItems, setTextItems] = useState<TextItemPosition[]>([]);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!show) return;
    // Load text items for this page
    import("pdfjs-dist").then(async (pdfjsLib) => {
      configurePdfJsWorker(pdfjsLib);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const items: TextItemPosition[] = [];
      for (let i = 0; i < textContent.items.length; i++) {
        const item = textContent.items[i];
        if (!("str" in item)) continue;
        items.push({
          str: item.str,
          transform: item.transform,
          width: item.width,
          height: item.height,
          page: pageNumber - 1,
          itemIndex: i,
        });
      }
      setTextItems(items);
    });
  }, [show, file, pageNumber]);

  const handleSelectItem = useCallback(
    (index: number) => {
      setSelectedItem(index);
      setEditText(textItems[index]?.str || "");
      inputRef.current?.focus();
    },
    [textItems]
  );

  const handleSaveEdit = useCallback(() => {
    if (selectedItem === null || !editText.trim()) return;
    onEdit(pageNumber - 1, [{ index: selectedItem, newText: editText }]);
    setSelectedItem(null);
    setShow(false);
  }, [selectedItem, editText, pageNumber, onEdit]);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
      >
        Edit Text
      </button>
    );
  }

  return (
    <div className="absolute top-2 left-2 z-30 bg-card border border-border rounded-xl p-3 shadow-xl max-w-[300px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">Edit Text</span>
        <button onClick={() => setShow(false)} className="text-muted-foreground hover:text-foreground text-xs">
          ✕
        </button>
      </div>

      <div className="max-h-[200px] overflow-y-auto space-y-1 mb-2">
        {textItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectItem(idx)}
            className={`w-full text-left px-2 py-1 text-xs rounded-md transition-colors ${
              selectedItem === idx
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-foreground"
            }`}
          >
            {item.str}
          </button>
        ))}
      </div>

      {selectedItem !== null && (
        <div className="flex gap-1">
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") setShow(false);
            }}
            className="flex-1 px-2 py-1 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSaveEdit}
            className="px-2 py-1 text-xs font-medium bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
