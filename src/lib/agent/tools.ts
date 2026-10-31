

import { qlooClient } from "@/lib/qloo/client";
import { cachedQlooInsights } from "@/lib/qloo/insights";
import type {
  QlooEntity,
  TasteProfile,
  AmbienceDesign,
  RoomType,
} from "@/lib/types";


export type ToolName =
  | "resolve_entity"
  | "get_taste_neighbors"
  | "build_taste_profile"
  | "design_lighting"
  | "critique_design";

export interface ResolveEntityInput {
  query: string;
  type?: string;
}

export interface GetTasteNeighborsInput {
  entityIds: string[];
  targetType: string;
  limit: number;
}

export interface BuildTasteProfileInput {
  entities: QlooEntity[];
  neighbors: Array<{ id: string; name: string; type: string }>;
}

export interface DesignLightingInput {
  room: RoomType;
  purpose: string[];
  tasteProfile: TasteProfile;
}

export interface CritiqueDesignInput {
  tasteProfile: TasteProfile;
  design: AmbienceDesign;
  roomPurpose: string[];
}

export async function resolveEntity(input: ResolveEntityInput): Promise<QlooEntity | null> {
  return qlooClient.resolveEntity(input.query, input.type ?? undefined);
}

export async function getTasteNeighbors(input: GetTasteNeighborsInput) {
  return cachedQlooInsights(input.entityIds, input.targetType, input.limit);
}

export function buildTasteProfile(input: BuildTasteProfileInput): TasteProfile {
  const scores: Partial<Record<keyof TasteProfile, number>> = {
    cinematic: 0.0,
    minimal: 0.0,
    warm: 0.0,
    futuristic: 0.0,
    nocturnal: 0.0,
    social: 0.0,
  };

  const evidence: TasteProfile["evidence"] = [];

  input.entities.forEach((entity) => {
    const sigs = inferSignals(entity.name, entity.type);
    sigs.forEach(([dim, weight, source]) => {
      scores[dim] = Math.min(1, (scores[dim] ?? 0) + weight);
      evidence.push({
        sourceEntity: entity.name,
        qlooEntityId: entity.id,
        derivedSignal: source,
      });
    });
  });

  input.neighbors.slice(0, 20).forEach((neighbor) => {
    const sigs = inferSignals(neighbor.name, neighbor.type);
    sigs.forEach(([dim, weight, source]) => {
      scores[dim] = Math.min(1, (scores[dim] ?? 0) + weight * 0.4);
      evidence.push({
        sourceEntity: neighbor.name,
        qlooEntityId: neighbor.id,
        derivedSignal: `${source} via Qloo neighbor`,
      });
    });
  });

  const profile: TasteProfile = {
    cinematic: normalize(scores.cinematic ?? 0),
    minimal: normalize(scores.minimal ?? 0),
    warm: normalize(scores.warm ?? 0),
    futuristic: normalize(scores.futuristic ?? 0),
    nocturnal: normalize(scores.nocturnal ?? 0),
    social: normalize(scores.social ?? 0),
    evidence: evidence.slice(0, 20),
  };

  return profile;
}

export function designLighting(input: DesignLightingInput): AmbienceDesign {
  const profile = input.tasteProfile;
  const isReading = input.purpose.some((p) => /read|study|focus/i.test(p));
  const isSocial = input.purpose.some(
    (p) => /host|friend|party|people|guest|dinner|entertain/i.test(p)
  );

  const conceptName = generateConcept(profile, input.room);

  const ambientKelvin = kelvinFromProfile(profile, "warm", isReading ? 3000 : 2700);
  const accentKelvin = kelvinFromProfile(profile, "futuristic", 2200);

  const ambientBrightness = isSocial
    ? Math.min(1, Math.max(0, 0.75))
    : isReading
      ? Math.min(1, Math.max(0, 0.6))
      : Math.min(1, Math.max(0, 0.55));
  const accentBrightness = Math.min(
    1,
    Math.max(
      0,
      Number(profile.futuristic > 0.6) ? 0.45 : isSocial ? 0.5 : 0.3
    )
  );

  const placement = buildPlacement(input.room, isReading, isSocial, profile.nocturnal > 50);
  const fixtureStyle = buildFixtureStyle(profile, input.room);
  const palette = buildPalette(profile);
  const scenes = buildScenes(profile, input.room, isReading, isSocial);

  return {
    concept: conceptName,
    ambient: { kelvin: ambientKelvin, brightness: ambientBrightness },
    accent: { kelvin: accentKelvin, brightness: accentBrightness },
    placement,
    fixtureStyle,
    palette,
    scenes,
  };
}

export function critiqueDesign(input: CritiqueDesignInput): {
  ok: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const { tasteProfile, design, roomPurpose } = input;

  if (design.ambient.brightness < 0.1 && !roomPurpose.some((p: string) => /movie|mood|dim/i.test(p))) {
    issues.push("Ambient brightness is extremely low for this room purpose.");
  }

  if (
    design.ambient.kelvin > 4000 &&
    roomPurpose.some((p: string) => /relax|read|jazz|late-night|mood/i.test(p))
  ) {
    issues.push("Color temperature feels too cool for the intended mood.");
  }

  if (design.ambient.brightness > 0.85 && roomPurpose.some((p: string) => /read|mood/i.test(p))) {
    issues.push("Ambient brightness may be too high for a calm reading mood.");
  }

  if (design.placement.length === 0) {
    issues.push("No placement recommendations were generated.");
  }

  if (tasteProfile.futuristic > 0.6 && !design.fixtureStyle.some((s: string) => /minimal|black|sleek|matte/i.test(s))) {
    issues.push("Futuristic taste is not strongly reflected in fixture style.");
  }

  if (tasteProfile.minimal > 0.7 && !design.placement.some((p) => /minimal|clean|uncluttered/i.test(p))) {
    issues.push("Minimal taste does not clearly translate into placement.");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

function inferSignals(name: string, type: string): Array<[keyof TasteProfile, number, string]> {
  const lower = name.toLowerCase();
  const signals: Array<[keyof TasteProfile, number, string]> = [];

  if (/blade runner|cyber|pcyberpunk|futur|sci.?fi|neon/i.test(lower)) {
    signals.push(["futuristic", 0.3, "sci-fi aesthetic from entity"]);
    signals.push(["nocturnal", 0.15, "nocturnal reference from entity"]);
    signals.push(["cinematic", 0.25, "cinematic reference from entity"]);
  }
  if (/jazz|nocturne|night|late.?night|bar|lounge|soul|frank ocean|miike|ambient/i.test(lower)) {
    signals.push(["nocturnal", 0.25, "night / late-night reference from entity"]);
    signals.push(["warm", 0.15, "moody / intimate reference from entity"]);
    signals.push(["social", 0.1, "social / lounge reference from entity"]);
  }
  if (/minimal|japanese|japandi|clean|zen|simple/i.test(lower)) {
    signals.push(["minimal", 0.3, "minimalist aesthetic from entity"]);
    signals.push(["warm", 0.1, "warm minimalism from entity"]);
  }
  if (/tokyo|shibuya|shinjuku|neon|night.?city/i.test(lower)) {
    signals.push(["nocturnal", 0.2, "night city reference from entity"]);
    signals.push(["futuristic", 0.1, "urban futuristic reference from entity"]);
    signals.push(["social", 0.1, "social scene from entity"]);
  }
  if (/hotel|lobby|lodge|resort|luxury/i.test(lower)) {
    signals.push(["warm", 0.15, "hospitality warmth from entity"]);
    signals.push(["social", 0.1, "social hospitality from entity"]);
  }
  if (/movie|cinematic|film|director/i.test(lower)) {
    signals.push(["cinematic", 0.3, "cinematic framing from entity"]);
  }
  if (/artist|music|band|song|album|podcast/i.test(lower)) {
    signals.push(["warm", 0.1, "musical mood from entity"]);
  }
  if (/place|restaurant|cafe|lounge/i.test(lower)) {
    signals.push(["social", 0.12, "social place from entity"]);
  }

  return signals;
}

function normalize(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 100);
}

function kelvinFromProfile(profile: TasteProfile, source: keyof TasteProfile, fallback: number): number {
  const score = (profile[source] as number) / 100;
  if (source === "warm") {
    const k = 2000 + (1 - score) * 1000;
    return clamp(Math.round(k));
  }
  if (source === "futuristic") {
    const k = 2600 + (1 - score) * 800;
    return clamp(Math.round(k));
  }
  return clamp(Math.round(fallback + (1 - score) * 400));
}

function clamp(value: number, min?: number, max?: number): number {
  const _min = min ?? 0;
  const _max = max ?? 1;
  return Math.min(_max, Math.max(_min, value));
}

function generateConcept(profile: TasteProfile, room: RoomType): string {
  const themes: string[] = [];
  if (profile.cinematic > 60) themes.push("Cinematic");
  if (profile.futuristic > 60) themes.push("Future");
  if (profile.nocturnal > 60) themes.push("Nocturnal");
  if (profile.warm > 60) themes.push("Warm");
  if (profile.minimal > 60) themes.push("Minimal");
  if (profile.social > 60) themes.push("Social");
  if (themes.length === 0) themes.push("Balanced");

  const suffix =
    room === "living_room"
      ? "Living"
      : room === "bedroom"
        ? "Bedroom"
        : room === "office"
          ? "Work"
          : "Room";

  const joining = themes.length > 1 ? " " : "";
  return `${themes.join(joining)}${joining}${suffix}`;
}

function buildPlacement(
  room: RoomType,
  reading: boolean,
  social: boolean,
  nocturnal: boolean
): string[] {
  const placement: string[] = [];

  placement.push(room === "living_room" ? "wall wash behind sofa" : "indirect wall wash");
  placement.push(
    reading
      ? "localized reading lamp"
      : social
        ? "perimeter accent zones"
        : "low-level side lighting"
  );

  if (nocturnal) {
    placement.push("no harsh overhead ceiling light");
    placement.push("darker lower zones for depth");
  }

  if (!reading) {
    placement.push("avoid central overhead glare");
  }

  return placement;
}

function buildFixtureStyle(profile: TasteProfile, room: RoomType): string[] {
  const style: string[] = [];
  if (profile.minimal > 60) style.push("minimal");
  if (profile.futuristic > 60) style.push("matte black");
  else style.push("matte", "brushed metal");
  if (profile.warm > 60) style.push("warm metal", "soft fabric shade");
  if (style.length === 0) style.push("clean", "neutral");
  return [...new Set(style)];
}

function buildPalette(profile: TasteProfile): string[] {
  const palette: string[] = [];
  if (profile.futuristic > 60) palette.push("charcoal", "deep slate", "soft metallic");
  if (profile.warm > 60) palette.push("warm ivory", "amber accent");
  if (profile.nocturnal > 60) palette.push("midnight blue", "low-glare matte surfaces");
  if (profile.minimal > 60) palette.push("neutral ground tones");
  if (palette.length === 0) palette.push("warm neutral", "soft contrast");
  return [...new Set(palette)];
}

function buildScenes(
  profile: TasteProfile,
  room: RoomType,
  reading: boolean,
  social: boolean
): AmbienceDesign["scenes"] {
  return [
    {
      name: "Morning",
      kelvin: clamp(Math.round(3200 + (profile.futuristic > 60 ? -300 : 0))),
      brightness: 0.65,
      note: "clean, balanced start of day",
    },
    {
      name: "Focus",
      kelvin: 3500,
      brightness: 0.7,
      note: "localized task lighting when reading or working",
    },
    {
      name: "Dinner",
      kelvin: 2400,
      brightness: 0.4,
      note: "warm accent lighting, relaxed mood",
    },
    {
      name: "Movie",
      kelvin: 2200,
      brightness: 0.15,
      note: "wall wash, minimal direct light",
    },
    {
      name: "Party",
      kelvin: 2700,
      brightness: social ? 0.75 : 0.6,
      note: "multiple accent zones, brighter perimeter",
    },
  ];
}
