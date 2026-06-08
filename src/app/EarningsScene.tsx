"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const rows = [
  { icon: "🏍️", label: "Ride orders", sub: "18 trips", amount: "₦27,000" },
  { icon: "🛒", label: "Market errands", sub: "7 errands", amount: "₦15,500" },
];

export default function EarningsScene() {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [10, -10]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-10, 10]), { stiffness: 200, damping: 30 });

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
      className="flex justify-center lg:justify-end"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{ y: -10 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="relative w-full max-w-sm"
      >
        {/* Glow */}
        <div className="absolute inset-0 rounded-3xl bg-orange-500/30 blur-2xl scale-95 -z-10" />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full rounded-3xl bg-slate-800 border border-slate-700 overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5">
            <p className="text-orange-100 text-sm font-semibold">Sample weekly earnings</p>
            <p className="text-white text-4xl font-extrabold mt-1">₦42,500</p>
            <p className="text-orange-100 text-xs mt-1">Based on 25 orders · 6 days</p>
          </div>

          <div className="px-6 py-5 flex flex-col gap-4">
            {rows.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease: "easeOut" }}
                className="flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{row.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{row.label}</p>
                    <p className="text-xs text-slate-500">{row.sub}</p>
                  </div>
                </div>
                <p className="font-bold text-white">{row.amount}</p>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="border-t border-slate-700 pt-4 flex justify-between items-center"
            >
              <p className="text-sm text-slate-400">Your take (85%)</p>
              <p className="font-extrabold text-orange-400 text-xl">₦36,125</p>
            </motion.div>
          </div>

          <div className="px-6 pb-5">
            <p className="text-xs text-slate-500 text-center">Earnings vary by city, hours, and order volume.</p>
          </div>
        </motion.div>

        {/* Paid badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.7, type: "spring", stiffness: 200 }}
          style={{ transform: "translateZ(60px)", position: "absolute", top: "-16px", right: "-16px" }}
          className="flex items-center gap-2 rounded-2xl bg-green-500 shadow-xl shadow-green-500/30 px-3.5 py-2.5"
        >
          <span className="text-white text-sm">✓</span>
          <p className="text-xs font-extrabold text-white">Paid to bank</p>
        </motion.div>

        {/* No fees badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.85, type: "spring", stiffness: 200 }}
          style={{ transform: "translateZ(50px)", position: "absolute", bottom: "-16px", left: "-16px" }}
          className="flex items-center gap-2 rounded-2xl bg-slate-700 border border-slate-600 shadow-xl px-3.5 py-2.5"
        >
          <span className="text-base">🎉</span>
          <p className="text-xs font-extrabold text-white">Zero monthly fees</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
