import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#10b981",
          },
        }}
      />
    </div>
  );
}
