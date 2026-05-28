interface CellProps {
  value: number;
  isGiven: boolean;
  isSelected: boolean;
  isMistake: boolean;
  isHighlighted: boolean;
  isSameValue: boolean;
  onClick: () => void;
}

export function Cell({ value, isGiven, isSelected, isMistake, isHighlighted, isSameValue, onClick }: CellProps) {
  let bg = "bg-white";
  if (isSelected) bg = "bg-blue-300";
  else if (isMistake) bg = "bg-red-100";
  else if (isSameValue) bg = "bg-yellow-100";
  else if (isHighlighted) bg = "bg-blue-50";

  const textColor = isGiven
    ? "text-gray-900 font-semibold"
    : isMistake
      ? "text-red-600"
      : "text-blue-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-10 flex items-center justify-center text-lg select-none cursor-pointer border border-gray-300 transition-colors ${bg} ${textColor} ${!isGiven ? "hover:bg-blue-100" : ""}`}
    >
      {value !== 0 ? value : ""}
    </button>
  );
}
