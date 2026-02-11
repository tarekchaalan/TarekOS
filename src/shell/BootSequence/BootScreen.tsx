import { useEffect, useState, useRef } from "react";

interface BootScreenProps {
  onComplete: () => void;
}

export function BootScreen({ onComplete }: BootScreenProps) {
  const [phase, setPhase] = useState<"logo" | "loading" | "fadeout">("logo");
  const [dotIndex, setDotIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase progression: logo (800ms) -> loading (2200ms) -> fadeout (500ms) -> done
  useEffect(() => {
    timerRef.current = setTimeout(() => setPhase("loading"), 800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "loading") {
      timerRef.current = setTimeout(() => setPhase("fadeout"), 2200);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
    if (phase === "fadeout") {
      timerRef.current = setTimeout(onComplete, 500);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [phase, onComplete]);

  // Animate loading dots
  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setDotIndex((i) => (i + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === "fadeout" ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background:
          "linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 40%, #0e0e3a 100%)",
      }}
    >
      {/* Boot logo */}
      <div
        className={`mb-8 transition-all duration-700 ${
          phase === "logo" ? "scale-90 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <img
          src="/assets/icons/favicon.svg"
          alt="TarekOS logo"
          className="h-30 w-30"
        />
      </div>

      {/* Title */}
      <div
        className={`mb-10 text-center transition-all duration-700 ${
          phase === "logo"
            ? "translate-y-4 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <h1 className="text-[28px] font-light tracking-wider text-white/90">
          TarekOS
        </h1>
      </div>

      {/* Loading dots animation */}
      {phase === "loading" && (
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[6px] w-[6px] rounded-full transition-all duration-300"
              style={{
                backgroundColor:
                  dotIndex === i
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.2)",
                transform: dotIndex === i ? "scale(1.4)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}

      {/* Copyright footer */}
      <div className="absolute bottom-8 text-[11px] text-white/30">
        Portfolio by Tarek
      </div>
    </div>
  );
}
