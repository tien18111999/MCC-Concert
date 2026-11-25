import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UA = "MCC-Turn-It-Up/1.0 (festival trip planner; info@mccollege.edu)";

type Point = { lat: number; lng: number };
type Step = { text: string; minutes: number; line: string };
type TripRoute = { minutes: number; meters: number; steps: Step[]; path: [number, number][] };

function point(value: string | null): Point | null {
  if (!value) return null;
  const [lat, lng] = value.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function directMeters(from: Point, to: Point) {
  const radians = Math.PI / 180;
  const x = (to.lng - from.lng) * radians * Math.cos(((from.lat + to.lat) / 2) * radians);
  const y = (to.lat - from.lat) * radians;
  return 6371000 * Math.hypot(x, y);
}

function pathMeters(path: [number, number][]) {
  let meters = 0;
  for (let index = 1; index < path.length; index += 1) {
    const [lat1, lng1] = path[index - 1];
    const [lat2, lng2] = path[index];
    const radians = Math.PI / 180;
    const x = (lng2 - lng1) * radians * Math.cos(((lat1 + lat2) / 2) * radians);
    const y = (lat2 - lat1) * radians;
    meters += 6371000 * Math.hypot(x, y);
  }
  return Math.round(meters);
}

function sample(path: [number, number][], max = 180): [number, number][] {
  if (path.length <= max) return path;
  const step = (path.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, index) => path[Math.round(index * step)]);
}

function decodePolyline(encoded: string): [number, number][] {
  const path: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;
    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    path.push([lat / 1e7, lng / 1e7]);
  }
  return path;
}

function osrmStep(step: { name?: string; duration?: number; maneuver?: { type?: string; modifier?: string } }): Step {
  const type = step.maneuver?.type || "continue";
  const modifier = step.maneuver?.modifier || "";
  const name = step.name || "";
  let text = "Continue";
  if (type === "depart") text = name ? `Start on ${name}` : "Start";
  else if (type === "arrive") text = name ? `Arrive at ${name}` : "Arrive";
  else if (type === "turn" || type === "end of road") text = `Turn ${modifier}${name ? ` onto ${name}` : ""}`.trim();
  else if (type === "roundabout" || type === "rotary") text = `Take the roundabout${name ? ` onto ${name}` : ""}`;
  else text = `${modifier || "Continue"}${name ? ` on ${name}` : ""}`.trim();
  return { text, minutes: Math.max(1, Math.round((step.duration || 0) / 60)), line: "" };
}

async function osrm(profile: "driving" | "foot", from: Point, to: Point): Promise<TripRoute | null> {
  const host = profile === "driving" ? "https://routing.openstreetmap.de/routed-car" : "https://routing.openstreetmap.de/routed-foot";
  const url = `${host}/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    code?: string;
    routes?: { duration?: number; distance?: number; geometry?: { coordinates?: [number, number][] }; legs?: { steps?: Parameters<typeof osrmStep>[0][] }[] }[];
  };
  const route = body.code === "Ok" ? body.routes?.[0] : null;
  if (!route?.duration) return null;
  const coordinates = route.geometry?.coordinates || [];
  const routed = {
    minutes: Math.max(1, Math.round(route.duration / 60)),
    meters: Math.round(route.distance || 0),
    steps: (route.legs?.[0]?.steps || []).slice(0, 6).map(osrmStep),
    path: sample(coordinates.map(([lng, lat]) => [lat, lng])),
  };
  if (profile === "foot") {
    const direct = directMeters(from, to);
    if (routed.meters > direct * 3) {
      const minutes = Math.max(1, Math.ceil(((direct / 1000) * 1.3) / 4.8 * 60));
      return {
        minutes,
        meters: Math.round(direct),
        steps: [{ text: "Walk toward the stop", minutes, line: "" }],
        path: [
          [from.lat, from.lng],
          [to.lat, to.lng],
        ],
      };
    }
  }
  return routed;
}

async function transit(from: Point, to: Point): Promise<TripRoute | null> {
  const url = `https://api.transitous.org/api/v1/plan?fromPlace=${from.lat},${from.lng}&toPlace=${to.lat},${to.lng}&numItineraries=1`;
  const response = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    itineraries?: {
      duration?: number;
      legs?: {
        mode?: string;
        routeShortName?: string;
        duration?: number;
        distance?: number;
        from?: { name?: string };
        to?: { name?: string };
        legGeometry?: { points?: string };
      }[];
    }[];
  };
  const trip = body.itineraries?.[0];
  if (!trip?.duration || !trip.legs?.length) return null;
  const steps = trip.legs.slice(0, 6).map((leg) => {
    const mode = (leg.mode || "WALK").toLowerCase();
    const routeName = leg.routeShortName || "";
    const target = leg.to?.name && leg.to.name !== "END" ? leg.to.name : "the destination";
    const line = routeName ? `${routeName} ${mode}` : "";
    const text = mode === "walk" ? `Walk to ${target}` : `Ride to ${target}`;
    return { text, minutes: Math.max(1, Math.round((leg.duration || 0) / 60)), line };
  });
  const path = trip.legs.flatMap((leg) => (leg.legGeometry?.points ? decodePolyline(leg.legGeometry.points) : []));
  const reported = trip.legs.reduce((sum, leg) => sum + (leg.distance || 0), 0);
  return {
    minutes: Math.max(1, Math.round(trip.duration / 60)),
    meters: Math.max(Math.round(reported), pathMeters(path)),
    steps,
    path: sample(path),
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = params.get("mode");
  const from = point(params.get("from"));
  const to = point(params.get("to"));
  if (!from || !to || (mode !== "drive" && mode !== "walk" && mode !== "transit")) {
    return NextResponse.json({ route: null }, { status: 400 });
  }
  try {
    const route = mode === "transit" ? await transit(from, to) : await osrm(mode === "drive" ? "driving" : "foot", from, to);
    return NextResponse.json({ route });
  } catch {
    return NextResponse.json({ route: null });
  }
}
