import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  activeDates: string[]; // "YYYY-MM-DD" strings that have chats
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function MiniCalendar({ activeDates, selectedDate, onSelectDate }: MiniCalendarProps) {
  // Default to March 2026
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(2); // 0-indexed → March

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white border border-[#d0d0d0] rounded w-[232px] p-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          className="p-1 rounded hover:bg-[#f0f0f0] text-[#555]"
          onClick={prevMonth}
        >
          <ChevronLeft size={13} />
        </button>
        <span className="text-[12px] font-bold text-[#333]">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          className="p-1 rounded hover:bg-[#f0f0f0] text-[#555]"
          onClick={nextMonth}
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-[#aaa] py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const key = toKey(viewYear, viewMonth, day);
          const hasChats = activeDates.includes(key);
          const isSelected = selectedDate === key;
          return (
            <button
              key={key}
              onClick={() => onSelectDate(isSelected ? null : key)}
              className={`
                flex flex-col items-center justify-center rounded py-0.5
                text-[12px]
                ${isSelected ? "bg-[#333] text-white" : "hover:bg-[#f0f0f0] text-[#333]"}
                ${!hasChats && !isSelected ? "text-[#bbb]" : ""}
              `}
            >
              {day}
              {hasChats && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-[#777] mt-0.5" />
              )}
              {hasChats && isSelected && (
                <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Clear */}
      {selectedDate && (
        <button
          className="mt-2 w-full text-center text-[11px] text-[#888] hover:text-[#333] border-t border-[#ebebeb] pt-2"
          onClick={() => onSelectDate(null)}
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
