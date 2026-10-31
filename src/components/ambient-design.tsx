"use client";

import { motion } from "framer-motion";
import { AmbienceDesign, TasteProfile } from "@/lib/types";

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface DNABarProps {
  label: string;
  value: number;
  delay?: number;
}

function DNABar({ label, value, delay = 0 }: DNABarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground/80">{label}</span>
        <span className="font-mono tabular-nums text-foreground">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-foreground/70 to-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{
            duration: 0.8,
            delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </div>
    </div>
  );
}

export function TasteDNA({ profile, className }: { profile: TasteProfile; className?: string }) {
  const dimensions = [
    { key: "cinematic" as const, label: "Cinematic" },
    { key: "minimal" as const, label: "Minimal" },
    { key: "warm" as const, label: "Warm" },
    { key: "futuristic" as const, label: "Futuristic" },
    { key: "nocturnal" as const, label: "Nocturnal" },
    { key: "social" as const, label: "Social" },
  ];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="text-xs font-medium uppercase tracking-widest text-foreground/50">
        Your Taste DNA
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {dimensions.map(({ key, label }, index) => (
          <DNABar
            key={key}
            label={label}
            value={profile[key]}
            delay={index * 0.08}
          />
        ))}
      </div>
      {profile.evidence.length > 0 && (
        <div className="text-xs text-foreground/60">
          Evidence: {profile.evidence.length} taste signals synthesized from your references.
        </div>
      )}
    </div>
  );
}

interface ConceptH1Props {
  concept: string;
}

export function ConceptH1({ concept }: ConceptH1Props) {
  return (
    <motion.h1
      className="text-3xl font-semibold tracking-tight sm:text-4xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {concept}
    </motion.h1>
  );
}

interface LightingSpecProps {
  label: string;
  kelvin: number;
  brightness: number;
}

function LightingSpec({ label, kelvin, brightness }: LightingSpecProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-foreground/10 bg-foreground/5 p-4">
      <div className="text-xs font-medium uppercase tracking-widest text-foreground/50">
        {label}
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold tabular-nums">{kelvin}K</span>
        <span className="h-7 w-px bg-foreground/20" />
        <span className="text-sm tabular-nums text-foreground/70">
          {Math.round(brightness * 100)}% brightness
        </span>
      </div>
    </div>
  );
}

export function LightingSpecs({ design }: { design: AmbienceDesign }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <LightingSpec label="Ambient" kelvin={design.ambient.kelvin} brightness={design.ambient.brightness} />
      <LightingSpec label="Accent" kelvin={design.accent.kelvin} brightness={design.accent.brightness} />
    </div>
  );
}

export function PlacementList({ placement }: { placement: string[] }) {
  return (
    <ul className="list-none flex flex-col gap-2">
      {placement.map((item, index) => (
        <motion.li
          key={item + index}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start gap-3 text-sm text-foreground/80"
        >
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/60" />
          {item}
        </motion.li>
      ))}
    </ul>
  );
}

export function FixtureTags({ styles }: { styles: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((style) => (
        <span
          key={style}
          className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs text-foreground/80"
        >
          {style}
        </span>
      ))}
    </div>
  );
}

export function SceneChips({ scenes }: { scenes: AmbienceDesign["scenes"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {scenes.map((scene) => (
        <div
          key={scene.name}
          className="rounded-xl border border-foreground/10 bg-foreground/5 p-4"
        >
          <div className="text-sm font-medium">{scene.name}</div>
          <div className="mt-2 flex items-baseline gap-3 text-sm tabular-nums text-foreground/80">
            <span className="font-semibold">{scene.kelvin}K</span>
            <span className="h-4 w-px bg-foreground/20" />
            <span>{Math.round(scene.brightness * 100)}%</span>
          </div>
          <div className="mt-2 text-xs text-foreground/60">{scene.note}</div>
        </div>
      ))}
    </div>
  );
}

export function PaletteChips({ palette }: { palette: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {palette.map((color) => (
        <span
          key={color}
          className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-xs text-foreground/80"
        >
          {color}
        </span>
      ))}
    </div>
  );
}
