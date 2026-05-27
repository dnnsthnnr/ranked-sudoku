import { Cell } from "./Cell";

interface BoardProps {
  board: number[];
  given: boolean[];
  mistakes: Set<number>;
  selectedCell: number | null;
  onCellClick: (index: number) => void;
}

function getHighlighted(selected: number | null): Set<number> {
  if (selected === null) return new Set();
  const row = Math.floor(selected / 9);
  const col = selected % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const set = new Set<number>();
  for (let i = 0; i < 9; i++) {
    set.add(row * 9 + i); // same row
    set.add(i * 9 + col); // same col
  }
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      set.add(r * 9 + c); // same box
    }
  }
  return set;
}

export function Board({ board, given, mistakes, selectedCell, onCellClick }: BoardProps) {
  const highlighted = getHighlighted(selectedCell);

  return (
    <div className="inline-grid grid-cols-9 border-2 border-gray-800">
      {board.map((value, idx) => {
        const row = Math.floor(idx / 9);
        const col = idx % 9;
        // Thicker borders to delineate 3×3 boxes
        const borderRight = col === 2 || col === 5 ? "border-r-2 border-r-gray-800" : "";
        const borderBottom = row === 2 || row === 5 ? "border-b-2 border-b-gray-800" : "";

        return (
          <div key={idx} className={`${borderRight} ${borderBottom}`}>
            <Cell
              value={value}
              isGiven={given[idx]}
              isSelected={selectedCell === idx}
              isMistake={mistakes.has(idx)}
              isHighlighted={highlighted.has(idx) && selectedCell !== idx}
              onClick={() => onCellClick(idx)}
            />
          </div>
        );
      })}
    </div>
  );
}
