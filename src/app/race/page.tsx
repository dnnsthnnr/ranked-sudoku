import { RaceScreen } from "@/components/game/RaceScreen";

export default function RacePage() {
  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Race Mode</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Challenge a recorded run — beat their time to win
        </p>
      </div>
      <RaceScreen />
    </main>
  );
}
