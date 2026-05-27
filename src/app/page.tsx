import Link from "next/dist/client/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Ranked Sudoku</h1>

      <Link href={"/daily"}>
        <button>Daily</button>
      </Link>
      <Link href={"/race"}>
        <button>Ranked Game</button>
      </Link>
    </main>
  );
}
