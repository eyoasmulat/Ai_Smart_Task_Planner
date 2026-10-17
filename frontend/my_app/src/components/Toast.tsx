import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

type ToastProps = {
  message: string;
  type: "success" | "error";
};

export default function Toast({ message, type }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), 4500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message || !visible) return null;

  const Icon = type === "error" ? CircleAlert : CheckCircle2;

  return (
    <div className={`toast ${type}`} role={type === "error" ? "alert" : "status"}>
      <Icon size={19} aria-hidden="true" />
      <span>{message}</span>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss notification">
        <X size={17} />
      </button>
    </div>
  );
}
