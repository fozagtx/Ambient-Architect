export interface QlooEntity {
  id: string;
  name: string;
  type: string;
}

export interface CulturalReference {
  input: string;
  entityId?: string;
  entityType?: string;
  confidence?: number;
}

export interface TasteEvidence {
  sourceEntity: string;
  qlooEntityId: string;
  derivedSignal: string;
}

export interface TasteProfile {
  cinematic: number;
  minimal: number;
  warm: number;
  futuristic: number;
  nocturnal: number;
  social: number;
  evidence: TasteEvidence[];
}

export type RoomType =
  | "living_room"
  | "bedroom"
  | "office"
  | "gaming_room"
  | "dining_room"
  | "studio";

export interface AmbienceDesign {
  concept: string;
  ambient: {
    kelvin: number;
    brightness: number;
  };
  accent: {
    kelvin: number;
    brightness: number;
  };
  placement: string[];
  fixtureStyle: string[];
  palette: string[];
  scenes: Scene[];
}

export interface Scene {
  name: string;
  kelvin: number;
  brightness: number;
  note: string;
}

export interface TasteSession {
  room: RoomType;
  purpose: string[];
  references: CulturalReference[];
  resolvedEntities: QlooEntity[];
  tasteProfile: TasteProfile;
  ambienceDesign?: AmbienceDesign;
}
