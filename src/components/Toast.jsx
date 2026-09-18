import { useCallback, useRef, useState } from "react";

export function useToast() {
  const [msg, setMsg] = useState("");
  const timer = useRef();
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2800);
  }, []);
  const node = msg ? <div className="toast" role="status">{msg}</div> : null;
  return [node, show];
}
