import { ghostRunRepository } from "@/repositories";
import type { DifficultyTier } from "@/domain/puzzle";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tier = (searchParams.get("tier") ?? "easy") as DifficultyTier;

  const runs = await ghostRunRepository.listByTier(tier);

  return Response.json({
    runs: runs.map((r) => ({
      id: r.id,
      effectiveTime: r.effectiveTime,
      stampedElo: r.stampedElo,
    })),
  });
}
