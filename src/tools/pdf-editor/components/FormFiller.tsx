import { useState, useEffect } from "react";

interface FormField {
  id: string;
  type: "text" | "checkbox" | "radio" | "dropdown";
  name: string;
  value: string;
  rect: { x: number; y: number; width: number; height: number };
  page: number;
  options?: string[];
}

interface Props {
  fields: FormField[];
  onFieldChange: (id: string, value: string) => void;
  onClose: () => void;
}

export function FormFiller({ fields, onFieldChange, onClose }: Props) {
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const vals: Record<string, string> = {};
    fields.forEach((f) => {
      vals[f.id] = f.value;
    });
    setLocalValues(vals);
  }, [fields]);

  const handleChange = (id: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [id]: value }));
    onFieldChange(id, value);
  };

  if (fields.length === 0) {
    return (
      <div className="absolute bottom-4 right-4 z-30 bg-card border border-border rounded-xl p-4 shadow-xl w-80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">📋 Form Filler</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
            ✕
          </button>
        </div>
        <p className="text-xs text-muted-foreground">No form fields detected in this PDF.</p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-30 bg-card border border-border rounded-xl p-4 shadow-xl w-80 max-h-[300px] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">📋 Form Filler</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="text-xs font-medium text-foreground block mb-1">
              {field.name}
            </label>
            {field.type === "text" ? (
              <input
                type="text"
                value={localValues[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="w-full px-2 py-1 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : field.type === "checkbox" ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localValues[field.id] === "true"}
                  onChange={(e) => handleChange(field.id, e.target.checked ? "true" : "false")}
                  className="rounded border-border"
                />
                <span className="text-xs text-foreground">
                  {localValues[field.id] === "true" ? "Checked" : "Unchecked"}
                </span>
              </label>
            ) : field.type === "dropdown" && field.options ? (
              <select
                value={localValues[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="w-full px-2 py-1 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={localValues[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="w-full px-2 py-1 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-1">
        <button
          onClick={onClose}
          className="flex-1 px-3 py-1.5 text-xs font-medium border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
        >
          Close
        </button>
        <button
          onClick={() => {
            // Save form data - would call fillFormFields
            onClose();
          }}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Save Forms
        </button>
      </div>
    </div>
  );
}
