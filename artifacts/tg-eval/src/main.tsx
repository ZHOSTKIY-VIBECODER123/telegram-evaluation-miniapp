import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Telegram Mini App: signal ready and expand to full screen
const tg = (window as any).Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

createRoot(document.getElementById("root")!).render(<App />);
