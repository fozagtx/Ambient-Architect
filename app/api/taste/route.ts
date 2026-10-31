import { NextRequest, NextResponse } from "next/server";
import {
  buildTasteProfile,
  designLighting,
  critiqueDesign,
} from "@/lib/agent/tools";
import { TasteSession, RoomType, QlooEntity } from "@/lib/types";
import { qlooClient } from "@/lib/qloo/client";

const sessions = new Map<string, TasteSession>();

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const {
    sessionId = "default",
    action,
    query,
    type,
    room = "living_room",
    purpose = [],
    references = [],
  } = body as {
    sessionId?: string;
    action?: string;
    query?: string;
    type?: string;
    room?: RoomType;
    purpose?: string[];
    references?: Array<{ input: string; type?: string }>;
    neighborsLimit?: number;
  };

  if (action === "design" && references?.length && Array.isArray(purpose)) {
    const session: TasteSession = {
      room,
      purpose,
      references: references.map((r) => ({ input: r.input })),
      resolvedEntities: [],
      tasteProfile: {
        cinematic: 0,
        minimal: 0,
        warm: 0,
        futuristic: 0,
        nocturnal: 0,
        social: 0,
        evidence: [],
      },
      ambienceDesign: undefined,
    };

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, session);
    }

    const resolvedEntities: QlooEntity[] = [];
    for (const ref of references) {
      const entity = await qlooClient.resolveEntity(ref.input, ref.type);
      if (entity) {
        resolvedEntities.push(entity);
        session.resolvedEntities.push(entity);
        session.references.push({ input: ref.input, entityId: entity.id, entityType: entity.type });
      }
    }

    const allNeighbors: Array<{ id: string; name: string; type: string }> = [];
    for (const target of ["place", "artist", "brand"] as const) {
      try {
        const result = await qlooClient.search({ query: target, type: target });
        if (result) {
          allNeighbors.push({ id: result.id, name: result.name, type: result.type });
        }
      } catch {
        // ignore neighbor lookups that fail during the demo
      }
    }

    session.tasteProfile = buildTasteProfile({
      entities: resolvedEntities,
      neighbors: allNeighbors,
    });

    session.ambienceDesign = designLighting({
      room,
      purpose,
      tasteProfile: session.tasteProfile,
    });

    const critique = critiqueDesign({
      tasteProfile: session.tasteProfile,
      design: session.ambienceDesign,
      roomPurpose: purpose,
    });

    if (!critique.ok) {
      const redesigned = designLighting({
        room,
        purpose,
        tasteProfile: session.tasteProfile,
      });
      session.ambienceDesign = redesigned;
    }

    sessions.set(sessionId, session);
    return NextResponse.json({
      session: session,
      critique,
    });
  }

  const existing = sessions.get(sessionId);
  if (existing) {
    return NextResponse.json({ session: existing });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId") ?? "default";
  const session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "no session" }, { status: 404 });
  }
  return NextResponse.json({ session });
}
