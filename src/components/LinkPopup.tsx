import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type LinkPopupProps = {
  initialLabel?: string;
  position: { left: number; top: number };
  onCancel: () => void;
  onSubmit: (label: string, url: string) => void;
};

export function LinkPopup({ initialLabel = "", onCancel, onSubmit, position }: LinkPopupProps) {
  const [label, setLabel] = useState(initialLabel);
  const [url, setUrl] = useState("");
  const labelRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    labelRef.current?.focus();
    const id = window.setTimeout(() => labelRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, []);

  const submit = () => {
    if (label.trim() && url.trim()) {
      onSubmit(label.trim(), url.trim());
    }
  };

  return createPortal(
    <div className="link-popup" style={position}>
      <input
        ref={labelRef}
        aria-label="Link label"
        placeholder="Label"
        value={label}
        onChange={(event) => setLabel(event.currentTarget.value)}
        onKeyDown={(event) => handleKey(event, submit, onCancel, () => urlRef.current?.focus(), () => labelRef.current?.focus())}
      />
      <input
        ref={urlRef}
        aria-label="Link URL"
        placeholder="URL"
        value={url}
        onChange={(event) => setUrl(event.currentTarget.value)}
        onKeyDown={(event) => handleKey(event, submit, onCancel, () => urlRef.current?.focus(), () => labelRef.current?.focus())}
      />
    </div>,
    document.body,
  );
}

function handleKey(
  event: React.KeyboardEvent<HTMLInputElement>,
  submit: () => void,
  cancel: () => void,
  focusNext: () => void,
  focusPrevious: () => void,
) {
  if (event.key === "Enter") {
    event.preventDefault();
    submit();
  } else if (event.key === "Escape") {
    event.preventDefault();
    cancel();
  } else if (event.key === "Tab") {
    event.preventDefault();
    if (event.shiftKey) {
      focusPrevious();
    } else {
      focusNext();
    }
  } else if (event.key === "n" && event.currentTarget.value.length === 0) {
    event.preventDefault();
    focusNext();
  } else if (event.key === "N" && event.currentTarget.value.length === 0) {
    event.preventDefault();
    focusPrevious();
  }
}
