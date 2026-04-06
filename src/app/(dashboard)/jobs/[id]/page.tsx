import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Briefcase, CalendarDays, Coins, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JobDetailClient } from "./job-detail-client";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { locationId: true },
  });

  if (!user?.locationId) redirect("/onboarding");

  const job = await db.jobListing.findFirst({
    where: {
      id,
      locationId: user.locationId,
    },
    include: {
      location: true,
      employer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          societyName: true,
          residentVerified: true,
          trustScore: true,
        },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              societyName: true,
              trustScore: true,
            },
          },
        },
      },
    },
  });

  if (!job) notFound();

  const isEmployer = job.employerId === userId;
  const hasApplied = job.applications.some((application) => application.applicantId === userId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 text-left">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              {job.category}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Local job
            </Badge>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight">{job.title}</h1>

          <div className="mt-4 grid gap-3 text-xs text-slate-500 dark:text-zinc-400 sm:grid-cols-3">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              {job.location.area}, {job.location.city}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-500" />
              Posted {job.createdAt.toLocaleDateString("en-IN")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              {job.applications.length} applicants
            </span>
          </div>

          {job.salary && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-700 dark:text-emerald-300">
              <Coins className="h-4 w-4" />
              {job.salary}
            </div>
          )}

          <div className="mt-6 whitespace-pre-wrap rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:bg-zinc-950/60 dark:text-zinc-300">
            {job.description}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{job.employer.name || "Neighborhood employer"}</p>
                <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                  {job.employer.societyName || "Local resident"} • Trust {job.employer.trustScore}
                </p>
              </div>
            </div>
            {job.employer.residentVerified && (
              <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300">Verified resident</Badge>
            )}
          </Card>

          <JobDetailClient
            jobId={job.id}
            isEmployer={isEmployer}
            hasApplied={hasApplied}
            applications={job.applications.map((application) => ({
              id: application.id,
              coverLetter: application.coverLetter,
              resumeUrl: application.resumeUrl,
              createdAt: application.createdAt.toISOString(),
              applicant: {
                name: application.applicant.name,
                email: application.applicant.email,
                societyName: application.applicant.societyName,
                trustScore: application.applicant.trustScore,
              },
            }))}
          />
        </div>
      </div>
    </div>
  );
}
