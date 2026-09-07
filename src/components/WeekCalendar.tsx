"use client";

import { WEEKDAY_LABELS, weekDays, dateKey } from "@/lib/week";

export type ScheduledPostLike = {
  id: string;
  scheduledDate: string;
  content: string;
  imagePath: string | null;
  status: string;
  reviewNote?: string | null;
};

function statusDotClass(status: string) {
  if (status === "approved") return "status-dot ok";
  if (status === "rejected") return "status-dot rejected";
  return "status-dot pending";
}

export function WeekCalendar({
  weekStart,
  posts,
  onSelectPost,
}: {
  weekStart: Date;
  posts: ScheduledPostLike[];
  onSelectPost: (post: ScheduledPostLike) => void;
}) {
  const days = weekDays(weekStart);
  const grouped: Record<string, ScheduledPostLike[]> = {};
  for (const p of posts) {
    const key = dateKey(new Date(p.scheduledDate));
    (grouped[key] ??= []).push(p);
  }
  const today = dateKey(new Date());

  return (
    <div className="week-calendar">
      {days.map((day) => {
        const key = dateKey(day);
        const dayPosts = grouped[key] ?? [];
        return (
          <div className={`week-day${key === today ? " is-today" : ""}`} key={key}>
            <div className="week-day-header">
              <span className="week-day-label">{WEEKDAY_LABELS[day.getDay()]}</span>
              <span className="week-day-date">{day.getDate()}</span>
              {dayPosts.length > 0 && <span className="week-day-count">{dayPosts.length}</span>}
            </div>
            <div className="week-day-posts">
              {dayPosts.length === 0 ? (
                <span className="week-day-empty-hint">予定なし</span>
              ) : (
                dayPosts.map((p) => (
                  <button key={p.id} className="week-post-card" onClick={() => onSelectPost(p)}>
                    <span className={statusDotClass(p.status)} />
                    <span className="week-post-text">
                      {p.content.slice(0, 40)}
                      {p.content.length > 40 ? "…" : ""}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
