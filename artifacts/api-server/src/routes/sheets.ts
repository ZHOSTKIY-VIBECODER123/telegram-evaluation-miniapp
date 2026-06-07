import { Router, type IRouter } from "express";

const router: IRouter = Router();

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzCEPf-2tm_p7rz6hkGvaFa93OQX26uVDvYKVexkvrFzFewLqM06jcu3iodme5VQff72g/exec";

router.post("/sheets-sync", async (req, res) => {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

export default router;
