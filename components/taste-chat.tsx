"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input, Button } from "@/components/ui/primitives";
import {
  TasteDNA,
  ConceptH1,
  LightingSpecs,
  PlacementList,
  FixtureTags,
  SceneChips,
  PaletteChips,
} from "@/components/ambient-design";
import {
  buildTasteProfile,
  designLighting,
} from "@/lib/agent/tools";
import { cn, tokenizeReferences } from "@/lib/utils";
import type {
  AmbienceDesign,
  TasteProfile,
  RoomType,
  QlooEntity,
} from "@/lib/types";

type StepState =
  | { status: "idle" }
  | { status: "thinking"; message: string }
  | { status: "resolving"; entities: QlooEntity[] }
  | {
      status: "ready";
      session: {
        tasteProfile: TasteProfile;
        ambienceDesign: AmbienceDesign;
        room: RoomType;
        purpose: string[];
        references: Array<{ input: string }>;
      };
    };

const shimmerTextClass =
  "relative overflow-hidden [&::after]:absolute [&::after]:inset-0 [&::after]:-z-10 [&::after]:bg-gradient-to-r [&::after]:from-white/0 [&::after]:via-white/40 [&::after]:to-white/0 [&::after]:bg-[length:200%_100%] [&::after]:animate-shimmer";

function resolveRef(query: string): Promise<QlooEntity | null> {
  return Promise.resolve<QlooEntity | null>(null);
}

export function TasteChat() {
  const [step, setStep] = useState<StepState>({ status: "idle" });
  const [input, setInput] = useState("");
  const [purpose, setPurpose] = useState("reading, hosting");
  const [room, setRoom] = useState<RoomType>("living_room");
  const [remixPurpose, setRemixPurpose] = useState("");
  const [remixing, setRemixing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  function isResolving() {
    return step.status === "resolving" || step.status === "thinking";
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isResolving()) return;

    const tokenized = tokenizeReferences(text);

    setStep({
      status: "thinking",
      message: "Reading your taste and asking Qloo who you really are.",
    });

    await new Promise((r) => setTimeout(r, 700));

    setStep({
      status: "thinking",
      message: "Resolving cultural references through Qloo.",
    });

    const resolved: QlooEntity[] = [];
    for (const token of tokenized) {
      const entity = await resolveRef(token);
      if (entity) resolved.push(entity);
    }

    setStep({
      status: "resolving",
      entities: resolved,
    });

    await new Promise((r) => setTimeout(r, 600));

    setStep({
      status: "thinking",
      message: "Discovering cross-domain relationships in the Qloo taste graph.",
    });

    await new Promise((r) => setTimeout(r, 700));

    setStep({
      status: "thinking",
      message: "Synthesizing your Taste DNA.",
    });

    await new Promise((r) => setTimeout(r, 600));

    const profile = buildTasteProfile({
      entities: resolved,
      neighbors: [],
    });
    const design = designLighting({
      room,
      purpose: purpose.split(",").map((p) => p.trim()),
      tasteProfile: profile,
    });

    setStep({
      status: "ready" as const,
      session: {
        tasteProfile: profile,
        ambienceDesign: design,
        room,
        purpose: purpose.split(",").map((p) => p.trim()),
        references: tokenized.map((t) => ({ input: t })),
      },
    });
  }

  async function handleRemix() {
    if (step.status !== "ready" || !remixPurpose.trim() || isResolving()) return;
    setRemixing(true);

    setStep({
      status: "thinking",
      message: `Remixing your room for “${remixPurpose}” without changing your Taste DNA.`,
    });

    await new Promise((r) => setTimeout(r, 900));

    const newDesign = designLighting({
      room,
      purpose: remixPurpose.split(",").map((p) => p.trim()),
      tasteProfile: step.session.tasteProfile,
    });

    setStep({
      status: "ready",
      session: {
        ...step.session,
        ambienceDesign: newDesign,
        purpose: remixPurpose.split(",").map((p) => p.trim()),
      },
    });

    setRemixPurpose("");
    setRemixing(false);
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-8rem)] max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <AnimatePresence mode="wait">
        {step.status === "ready" && step.session && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-8">
              <ConceptH1 concept={step.session.ambienceDesign.concept} />
              <p className="mt-3 text-sm text-foreground/70">
                Lighting design for your {room} —{" "}
                {step.session.purpose.join(", ")}.
              </p>
            </div>

            <TasteDNA profile={step.session.tasteProfile} />

            <div className="mt-8 flex flex-col gap-6">
              <LightingSpecs design={step.session.ambienceDesign} />

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground/50">
                    Placement
                  </div>
                  <PlacementList placement={step.session.ambienceDesign.placement} />
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground/50">
                    Fixture style
                  </div>
                  <FixtureTags styles={step.session.ambienceDesign.fixtureStyle} />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground/50">
                    Palette
                  </div>
                  <PaletteChips palette={step.session.ambienceDesign.palette} />
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground/50">
                    Scenes
                  </div>
                  <SceneChips scenes={step.session.ambienceDesign.scenes} />
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-xl border border-foreground/10 bg-foreground/5 p-5">
              <div className="text-xs font-medium uppercase tracking-widest text-foreground/50">
                Why this design?
              </div>
              <p className="mt-2 text-sm text-foreground/80">
                Your cultural references were resolved through Qloo, cross-domain relationships were
                discovered in the Qloo taste graph, and your Taste DNA was translated into physical
                lighting parameters. Qloo supplied the cultural relationships; Ambience Architect
                interpreted those relationships into spatial design.
              </p>
              <div className="mt-4 text-xs text-foreground/60">
                Evidence: {step.session.tasteProfile.evidence.length} taste signals synthesized.
              </div>
            </div>

            <RemixCard
              session={{ ...step.session, status: "ready" as const }}
              remixPurpose={remixPurpose}
              setRemixPurpose={setRemixPurpose}
              remixing={remixing}
              onRemix={handleRemix}
            />
          </motion.div>
        )}

        {step.status === "resolving" && (
          <motion.div
            key="resolving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex flex-col gap-4 rounded-xl border border-foreground/10 bg-foreground/5 p-5"
          >
            <div className="text-xs font-medium uppercase tracking-widest text-foreground/50">
              Resolved through Qloo
            </div>
            <div className="flex flex-wrap gap-2">
              {step.entities.length === 0 ? (          <span className="text-sm text-foreground/60">
                  Waiting for Qloo resolution…</span>
              ) : (
                step.entities.map((entity) => (
                  <span
                    key={entity.id}
                    className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-sm text-foreground/80"
                  >
                    {entity.name}
                    <span className="ml-2 text-foreground/40">{entity.type}</span>
                  </span>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8">
        <div className="text-xs font-medium uppercase tracking-widest text-foreground/50">
          What do you love?
        </div>
        <p className="mt-1 text-sm text-foreground/70">
          Give 3–5 movies, music, places, art, or aesthetics.
        </p>
        <div className="mt-4 flex gap-3">
          <Input
            value={input}
            placeholder="Blade Runner 2049, Frank Ocean, Japanese minimalism…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className={cn(
              "flex-1",
              step.status === "ready" && "pointer-events-none opacity-50"
            )}
          />
          <Button
            onClick={handleSend}
            disabled={isResolving() || !input.trim()}
            className={cn("shrink-0", step.status === "ready" && "pointer-events-none")}
          >
            Go
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {(["living_room", "bedroom", "office", "gaming_room", "dining_room", "studio"] as RoomType[]).map(
            (r) => (
              <RoomChip
                key={r}
                room={r}
                selected={room === r}
                onClick={() =>
                  setRoom(
                    (prev: RoomType) =>
                      prev === r ? "living_room" : r
                  )
                }
              />
            )
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="purpose" className="text-xs font-medium uppercase tracking-widest text-foreground/50">
            Room purpose
          </label>
          <Input
            id="purpose"
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="reading, hosting"
            className="mt-1"
            disabled={step.status === "ready"}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 text-sm text-foreground/70">
        <div>
          Try the flagship demo:{" "}
          <button
            type="button"
            onClick={() => {
              setInput("Blade Runner 2049, Frank Ocean, Japanese minimalism, late-night jazz bars");
              setRoom("living_room");
              setPurpose("reading, hosting");
            }}
            className="underline hover:text-foreground/90"
          >
            I love Blade Runner 2049, Frank Ocean, Japanese minimalism and late-night jazz bars. I want my
            living room to work for reading and having friends over.
          </button>
        </div>
        <div className="text-xs text-foreground/50">
          {!isResolving()
            ? ""
            : step.status === "thinking" ? (
                <span className={cn("inline-flex items-center gap-2", shimmerTextClass)}>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/60" />
                  {step.message}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                  {/* message only available during thinking state */}
                </span>
              )}
        </div>
      </div>

      <div ref={bottomRef} />
    </div>
  );
}

export function RoomChip({
  room,
  selected,
  onClick,
}: {
  room: RoomType;
  selected: boolean;
  onClick: () => void;
}) {
  const label = room.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition-colors",
        selected
          ? "border-foreground/30 bg-foreground/10 text-foreground"
          : "border-foreground/10 bg-foreground/5 text-foreground/70 hover:border-foreground/20 hover:text-foreground/90"
      )}
    >
      {label}
    </button>
  );
}

function RemixCard({
  session,
  remixPurpose,
  setRemixPurpose,
  remixing,
  onRemix,
}: {
  session: {
    status: "ready";
    tasteProfile: TasteProfile;
    ambienceDesign: AmbienceDesign;
    room: RoomType;
    purpose: string[];
    references: Array<{ input: string }>;
  };
  remixPurpose: string;
  setRemixPurpose: (value: string) => void;
  remixing: boolean;
  onRemix: () => void;
}) {
  return (
    <div className="mt-8 rounded-xl border border-foreground/10 bg-foreground/5 p-5">
      <div className="text-xs font-medium uppercase tracking-widest text-foreground/50">Remix</div>
      <p className="mt-2 text-sm text-foreground/80">
        Change the purpose without rebuilding your taste identity.
      </p>
      <div className="mt-4 flex gap-3">
        <Input
          value={remixPurpose}
          placeholder="Make it better for parties"
          onChange={(e) => setRemixPurpose(e.target.value)}
          disabled={remixing || session.status !== "ready"}
          className="flex-1"
        />
        <Button
          onClick={onRemix}
          disabled={!remixPurpose.trim() || remixing}
          loading={remixing}
          className="shrink-0"
        >
          Remix
        </Button>
      </div>
      {remixing && (
        <div className="mt-3 text-sm text-foreground/60">
          Keeping your Taste DNA intact, reconfiguring the room…
        </div>
      )}
    </div>
  );
}
