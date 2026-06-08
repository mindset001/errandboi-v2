"use client";

import dynamic from "next/dynamic";

export const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });
export const EarningsScene = dynamic(() => import("./EarningsScene"), { ssr: false });
