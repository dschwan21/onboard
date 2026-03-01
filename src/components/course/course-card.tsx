import Link from "next/link";

import { ProgressBar } from "@/components/course/progress-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CourseSummary } from "@/lib/course-rules";

export function CourseCard({ summary }: { summary: CourseSummary }) {
  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-2xl font-semibold">{summary.course.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {summary.course.description ?? "No description yet."}
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{summary.progressPercentage}%</span>
        </div>
        <ProgressBar value={summary.progressPercentage} />
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {summary.completedLessons} of {summary.totalLessons} lessons completed
        </span>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href={`/course/${summary.course.id}`}>Open</Link>
          </Button>
          {summary.resumeHref ? (
            <Button asChild>
              <Link href={summary.resumeHref}>Resume</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
