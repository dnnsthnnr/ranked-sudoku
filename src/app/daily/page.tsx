import { DailyGameScreen } from "@/components/game/DailyGameScreen";

export default function DailyPage() {
  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Daily Puzzle</h1>
        <p className="text-gray-500 mt-1 text-sm">Solve today&apos;s puzzle at your own pace</p>
      </div>
      <DailyGameScreen />
    </main>
  );
}
