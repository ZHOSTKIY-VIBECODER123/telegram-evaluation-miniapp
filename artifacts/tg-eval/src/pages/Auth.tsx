import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/context/CurrentUserContext";
import { ROLES } from "@/data/roles";

export default function Auth() {
  const { login } = useCurrentUser();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 1 && role !== "";

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(name, role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] flex flex-col px-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex-1 flex flex-col justify-center"
      >
        {/* Логотип / заголовок */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-[28px] font-bold" style={{ color: "#000", letterSpacing: "-0.4px" }}>
            Добро пожаловать
          </h1>
          <p className="text-[15px] mt-1.5" style={{ color: "rgba(60,60,67,0.6)" }}>
            Представьтесь, чтобы продолжить
          </p>
        </div>

        {/* Поля */}
        <div className="rounded-[16px] overflow-hidden mb-3" style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <input
            className="w-full px-4 py-4 text-[16px] bg-transparent outline-none"
            style={{ borderBottom: "0.5px solid rgba(60,60,67,0.12)", color: "#000" }}
            placeholder="Фамилия и имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-4 text-[16px] bg-transparent outline-none appearance-none"
              style={{ color: role ? "#000" : "rgba(60,60,67,0.4)" }}
            >
              <option value="">Выберите роль...</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <ChevronDown
              className="h-4 w-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "rgba(60,60,67,0.4)" }}
            />
          </div>
        </div>

        {error && (
          <p className="text-[13px] px-1 mb-3" style={{ color: "#FF3B30" }}>{error}</p>
        )}

        <motion.button
          whileTap={canSubmit && !submitting ? { scale: 0.97 } : {}}
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full h-[52px] rounded-[16px] text-[17px] font-semibold flex items-center justify-center gap-2"
          style={{
            background: canSubmit ? "#007AFF" : "rgba(0,122,255,0.3)",
            color: "#fff",
            boxShadow: canSubmit ? "0 4px 16px rgba(0,122,255,0.35)" : "none",
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Вход...
            </>
          ) : (
            <>
              <Check className="h-5 w-5" /> Продолжить
            </>
          )}
        </motion.button>

        <p className="text-[12px] text-center mt-4 leading-snug" style={{ color: "rgba(60,60,67,0.45)" }}>
          Указанные имя и роль используются для авторизации.
          Сменить их можно в Настройках.
        </p>
      </motion.div>
    </div>
  );
}
