"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const float = (duration: number, delay = 0) => ({
  animate: { y: -10 },
  transition: { duration, delay, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" as const },
});

export default function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-250, 250], [14, -14]), { stiffness: 180, damping: 28 });
  const rotateY = useSpring(useTransform(mouseX, [-250, 250], [-14, 14]), { stiffness: 180, damping: 28 });

  function onMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      className="relative flex items-center justify-center h-[460px] select-none"
      style={{ perspective: "1100px" }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-72 w-72 rounded-full bg-orange-400/25 blur-3xl" />
      </div>

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* Main card */}
        <motion.div
          {...float(1.7, 0)}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ transform: "translateZ(50px)" }}
          className="w-72 rounded-3xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Order #ERB-2847</span>
            <span className="flex items-center gap-1.5 text-xs bg-white/20 text-white font-semibold px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                🏍️
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Adebayo K.</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-400">
                  <span className="text-yellow-400">★</span> 4.9 · Bike
                </div>
              </div>
              <span className="text-xs font-bold text-green-600 dark:text-green-400">On the way</span>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                <div className="w-0.5 flex-1 bg-gray-200 dark:bg-slate-600 min-h-[20px]" />
                <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Pickup</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Stadium Rd, Ilorin</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Drop-off</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200">GRA Phase 2</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[{ label: "ETA", value: "4 min" }, { label: "Fare", value: "₦850" }, { label: "Dist.", value: "2.3 km" }].map((s) => (
                <div key={s.label} className="bg-gray-50 dark:bg-slate-700/60 rounded-xl px-2 py-2 text-center">
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">{s.label}</p>
                  <p className="text-sm font-extrabold text-gray-900 dark:text-slate-100">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Rating badge */}
        <motion.div
          {...float(1.4, 0.3)}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="absolute -top-5 -right-6 flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 shadow-xl px-3.5 py-2.5 border border-gray-100 dark:border-slate-700"
          style={{ transform: "translateZ(90px)" }}
        >
          <span className="text-yellow-400 text-base">⭐</span>
          <div>
            <p className="text-xs font-extrabold text-gray-900 dark:text-slate-100">4.9 / 5</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">Driver rating</p>
          </div>
        </motion.div>

        {/* Payment badge */}
        <motion.div
          {...float(1.9, 0.6)}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="absolute -bottom-5 -left-8 flex items-center gap-2 rounded-2xl bg-green-500 shadow-xl shadow-green-500/30 px-3.5 py-2.5"
          style={{ transform: "translateZ(75px)" }}
        >
          <span className="text-white text-base">🔒</span>
          <div>
            <p className="text-xs font-extrabold text-white">Payment secured</p>
            <p className="text-[10px] text-green-100">Paystack · ₦850</p>
          </div>
        </motion.div>

        {/* Errand badge */}
        <motion.div
          {...float(1.6, 0.9)}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="absolute top-1/2 -translate-y-1/2 -left-16 flex items-center gap-2 rounded-2xl bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/30 shadow-lg px-3 py-2"
          style={{ transform: "translateZ(65px)" }}
        >
          <span className="text-base">🛒</span>
          <div>
            <p className="text-xs font-bold text-orange-700 dark:text-orange-300">Errand done</p>
            <p className="text-[10px] text-orange-500 dark:text-orange-400">3 items delivered</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
