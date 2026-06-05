"use client";

import { useState } from "react";
import { submitRating } from "./rating-actions";

interface Props {
  orderId: string;
  driverId: string | null;
  existingRating?: { stars: number; comment: string | null } | null;
}

export default function RatingForm({ orderId, driverId, existingRating }: Props) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(existingRating?.stars ?? 0);
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!!existingRating);

  const displayStars = hovered || selected;

  const labels: Record<number, string> = {
    1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Excellent!",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    const result = await submitRating(orderId, driverId, selected, comment);
    setLoading(false);
    if (result?.success) setDone(true);
  }

  if (done) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 text-center">
        <p className="text-2xl mb-2">🙏</p>
        <p className="font-bold text-gray-900 dark:text-slate-100 mb-1">Thanks for your rating!</p>
        <div className="flex justify-center gap-0.5 mb-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <StarIcon key={s} filled={s <= selected} size="md" />
          ))}
        </div>
        {comment && <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 italic">&ldquo;{comment}&rdquo;</p>}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-1">Rate your experience</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
        How was your {driverId ? "driver" : "errand agent"}?
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Star picker */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex gap-1"
            onMouseLeave={() => setHovered(0)}
          >
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelected(s)}
                onMouseEnter={() => setHovered(s)}
                className="transition-transform hover:scale-110 focus:outline-none"
                aria-label={`${s} stars`}
              >
                <StarIcon filled={s <= displayStars} size="lg" />
              </button>
            ))}
          </div>
          <p className={`text-sm font-semibold transition-opacity ${displayStars ? "opacity-100" : "opacity-0"} text-orange-500`}>
            {labels[displayStars] ?? ""}
          </p>
        </div>

        {/* Optional comment */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">
            Add a comment <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Great service, very fast..."
            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/40 resize-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={!selected || loading}
          className="rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting…" : "Submit rating"}
        </button>
      </form>
    </div>
  );
}

function StarIcon({ filled, size }: { filled: boolean; size: "md" | "lg" }) {
  const sz = size === "lg" ? "h-9 w-9" : "h-5 w-5";
  return (
    <svg
      className={`${sz} transition-colors`}
      viewBox="0 0 24 24"
      fill={filled ? "#f97316" : "none"}
      stroke={filled ? "#f97316" : "#d1d5db"}
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}
