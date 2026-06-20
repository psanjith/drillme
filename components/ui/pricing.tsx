"use client";

import { motion, useSpring } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Check, Star as LucideStar } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";

// --- HOOKS ---

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }
    const result = matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);
    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}

// --- INTERACTIVE STARFIELD ---

function Star({
  mousePosition,
  containerRef,
}: {
  mousePosition: { x: number | null; y: number | null };
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [initialPos] = useState({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: 1 + Math.random() * 2,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 5,
  });

  const springConfig = { stiffness: 100, damping: 15, mass: 0.1 };
  const springX = useSpring(0, springConfig);
  const springY = useSpring(0, springConfig);

  useEffect(() => {
    if (!containerRef.current || mousePosition.x === null || mousePosition.y === null) {
      springX.set(0);
      springY.set(0);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const starX = rect.left + (parseFloat(initialPos.left) / 100) * rect.width;
    const starY = rect.top + (parseFloat(initialPos.top) / 100) * rect.height;

    const deltaX = mousePosition.x - starX;
    const deltaY = mousePosition.y - starY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const radius = 600;

    if (distance < radius) {
      const force = 1 - distance / radius;
      springX.set(deltaX * force * 0.5);
      springY.set(deltaY * force * 0.5);
    } else {
      springX.set(0);
      springY.set(0);
    }
  }, [mousePosition, initialPos, containerRef, springX, springY]);

  return (
    <motion.div
      className="absolute bg-foreground rounded-full"
      style={{
        top: initialPos.top,
        left: initialPos.left,
        width: `${initialPos.size}px`,
        height: `${initialPos.size}px`,
        x: springX,
        y: springY,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.8, 0] }}
      transition={{ duration: initialPos.duration, repeat: Infinity, delay: initialPos.delay }}
    />
  );
}

function InteractiveStarfield({
  mousePosition,
  containerRef,
}: {
  mousePosition: { x: number | null; y: number | null };
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-60">
      {Array.from({ length: 60 }).map((_, i) => (
        <Star key={`star-${i}`} mousePosition={mousePosition} containerRef={containerRef} />
      ))}
    </div>
  );
}

// --- PRICING ---

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  note?: string;
  isPopular?: boolean;
}

interface PricingSectionProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function PricingSection({
  plans,
  title = "Simple, transparent pricing",
  description = "Start free. Upgrade when you're ready.",
}: PricingSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setMousePosition({ x: null, y: null })}
      className="relative w-full py-20"
    >
      <InteractiveStarfield mousePosition={mousePosition} containerRef={containerRef} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">{title}</h2>
          <p className="text-slate-400 text-lg whitespace-pre-line">{description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingCard({ plan, index }: { plan: PricingPlan; index: number }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      whileInView={{ y: plan.isPopular && isDesktop ? -20 : 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 20, delay: index * 0.15 }}
      className={cn(
        "rounded-2xl p-8 flex flex-col relative bg-[var(--card)]/70 backdrop-blur-sm",
        plan.isPopular ? "border-2 border-blue-500 shadow-xl" : "border border-[var(--card-border)]"
      )}
    >
      {plan.isPopular && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <div className="bg-blue-600 py-1.5 px-4 rounded-full flex items-center gap-1.5 whitespace-nowrap">
            <LucideStar className="text-white h-4 w-4 fill-current" />
            <span className="text-white text-sm font-semibold">Most Popular</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col text-center">
        <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
        <p className="mt-2 text-sm text-slate-400">{plan.description}</p>

        <div className="mt-6 flex items-baseline justify-center gap-x-1">
          <span className="text-5xl font-bold tracking-tight text-foreground">
            <NumberFlow
              value={Number(plan.price)}
              format={{ style: "currency", currency: "USD", minimumFractionDigits: 0 }}
              className="tabular-nums"
            />
          </span>
          <span className="text-sm font-semibold leading-6 tracking-wide text-slate-400">
            / {plan.period}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2 h-4">{plan.note ?? ""}</p>

        <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-left text-slate-400">
          {plan.features.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <Check className="h-6 w-5 flex-none text-blue-500" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <Link
            href={plan.href}
            className={cn(
              "w-full inline-flex items-center justify-center h-11 px-8 rounded-lg text-sm font-medium transition-colors",
              plan.isPopular
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "border border-[var(--card-border)] hover:bg-white/5 text-foreground"
            )}
          >
            {plan.buttonText}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
