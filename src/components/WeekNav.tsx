"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { formatWeekLabel } from "@/lib/week";

export function WeekNav({
  weekStart,
  onPrev,
  onNext,
  onToday,
  children,
}: {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="week-nav">
      <button className="icon-btn" onClick={onPrev} title="前の週">
        <ChevronLeftIcon />
      </button>
      <button className="btn-ghost small" onClick={onToday}>
        今週
      </button>
      <button className="icon-btn" onClick={onNext} title="次の週">
        <ChevronRightIcon />
      </button>
      <span className="week-nav-label">{formatWeekLabel(weekStart)}</span>
      <span className="week-nav-spacer" />
      {children}
    </div>
  );
}
