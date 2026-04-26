// components/Clock.tsx
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

export default function ClockHeader() {
  // null until mount so server HTML matches the client's first paint (avoids hydration mismatch).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm text-gray-500">
      <div className="py-2 px-4 cursor-default border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="tabular-nums">
          {now ? format(now, "PPpp") : "\u00a0"}
        </span>
      </div>
    </div>
  );
}
