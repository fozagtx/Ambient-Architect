# Ambience Architect

**Ambience Architect uses Qloo's cultural taste graph to turn the movies, music, places and aesthetics you love into a lighting design for the room you live in.**

## Live Demo

Try the flagship demo:
- Input: "I love Blade Runner 2049, Frank Ocean, Japanese minimalism and late-night jazz bars. I want my living room to work for reading and having friends over."
- Watch as Qloo resolves your cultural references, discovers cross-domain taste relationships, and generates a personalized lighting design.

## What It Does

Transforms your cultural taste into physical ambient lighting design using Qloo's cultural taste graph:

**Cultural identity → Qloo taste graph → Taste profile → Spatial aesthetic → Lighting specification**

Instead of asking users to understand interior-design terminology (color temperature, CRI, fixture type, indirect illumination, accent lighting), the product asks what they already understand:

> "What movies, music, places, art, fashion, or aesthetics do you love?"

## Core Transformation

```
Person → Cultural Taste → Qloo → Taste Profile → Ambience → Room
```

## How It Works

1. **Describe your feeling** - e.g., "calm enough to read but atmospheric enough to host people at night"
2. **Give cultural references** - 3-5 movies, music, places, art, or aesthetics
   - Example: Blade Runner 2049, Frank Ocean, Japanese minimalism, late-night jazz bars
3. **Qloo resolves** your references into entity IDs
4. **Qloo Insights** discovers cross-domain cultural relationships
5. **Taste DNA** synthesized from the relationships
6. **Ambience design** generated - lighting parameters, fixture styles, placement, scenes
7. **Remix** the same taste profile for different activities (reading → parties → movie night)

## Tech Stack

- **Frontend**: Next.js 16.4.3, TypeScript, Tailwind CSS, Framer Motion
- **Agent**: LLM + tool calling with Qloo integration
- **Cultural intelligence**: Qloo API (Search + Insights)
- **Deployment**: Vercel

## Qloo Integration

- Uses hackathon API environment: `https://hackathon.api.qloo.com`
- API key stored server-side only (never exposed to browser)
- Three core Qloo capabilities used:
  - Entity Search (`/search`)
  - Insights API (`/v2/insights`)
  - Cross-domain taste relationships

## MVP Features

- ✅ Taste onboarding with cultural references
- ✅ Qloo entity resolution
- ✅ Qloo-powered taste profile generation
- ✅ Ambience design (kelvin, brightness, placement, fixture style, palette, scenes)
- ✅ "Why this design?" explainability
- ✅ Remix same taste profile for different room purposes
- ✅ Scene generation (Morning, Focus, Dinner, Movie, Party)
- ✅ Server-side Qloo integration (key never exposed to browser)

## Development

```bash
npm run dev
# or npm run build for production
```

## Flagship Demo

> "I love Blade Runner 2049, Frank Ocean, Japanese minimalism and late-night jazz bars. I want my living room to work for reading and having friends over."

**Step 1**: Show entity resolution through Qloo ✓
**Step 2**: Show Qloo-powered cultural relationships ✓
**Step 3**: Generate Taste DNA (Cinematic 91%, Minimal 84%, Warm 79%, Futuristic 71%, Nocturnal 68%, Social 42%) ✓
**Step 4**: Generate "Quiet Future Jazz" lighting design ✓
**Step 5**: Show "Why this design?" explanation ✓
**Step 6**: Click "Remix → Make it better for parties" - lighting changes without changing Taste DNA ✓

## Core Principle

> **The LLM should never pretend to know what Qloo knows.**

- **LLM responsibilities**: conversation, intent extraction, orchestration, reasoning, synthesis, spatial translation
- **Qloo responsibilities**: entity resolution, cultural relationships, taste signals, cross-domain affinity
- **Ambience Architect's logic**: taste → aesthetic interpretation, aesthetic → lighting parameters, scene generation, explainability, remixing