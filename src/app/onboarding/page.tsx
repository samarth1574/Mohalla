import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user has already completed onboarding
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
  });

  // If already onboarded, redirect straight to feed
  if (dbUser && dbUser.locationId) {
    redirect("/feed");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-12">
      <OnboardingWizard />
    </main>
  );
}
