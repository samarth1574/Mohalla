"use client";

import React, { useState, useEffect } from "react";
import { loginAsMockUser, logoutMockUser } from "@/app/actions/mock-auth";

const DEMO_PERSONAS = [
  {
    id: "user_samarth",
    name: "Samarth Shekhar",
    email: "shekharsamarth1574@gmail.com",
    role: "USER" as const,
    societyName: "Gaur City 2",
    description: "Standard resident. Post on community feed, report lost items, and browse the marketplace.",
    avatarSeed: "samarth",
    badge: "Resident"
  },
  {
    id: "user_karan",
    name: "Karan Sharma",
    email: "karan@mohalla.in",
    role: "MODERATOR" as const,
    societyName: "Indiranagar Block A",
    description: "Community Moderator. Moderate toxic content and oversee report queues.",
    avatarSeed: "karan",
    badge: "Moderator"
  },
  {
    id: "user_aditi",
    name: "Aditi Patel",
    email: "aditi@mohalla.in",
    role: "ADMIN" as const,
    societyName: "Prestige Tech Park",
    description: "Society Admin. Broadcast official announcements and approve resident verification requests.",
    avatarSeed: "aditi",
    badge: "Society Admin"
  }
];

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = () => {
      const match = document.cookie.match(/(?:^|; )mohalla_mock_user_id=([^;]*)/);
      setUserId(match ? decodeURIComponent(match[1]) : null);
    };
    getUserId();
  }, []);

  const handleSignOut = async () => {
    await logoutMockUser();
    window.location.href = "/";
  };

  return {
    isSignedIn: !!userId,
    userId,
    isLoaded: true,
    signOut: handleSignOut
  };
}

export function useUser() {
  const { userId } = useAuth();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      const persona = DEMO_PERSONAS.find(p => p.id === userId) || DEMO_PERSONAS[0];
      setUser({
        id: userId,
        fullName: persona.name,
        primaryEmailAddress: { emailAddress: persona.email },
        imageUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${persona.avatarSeed}`
      });
    } else {
      setUser(null);
    }
  }, [userId]);

  return {
    isSignedIn: !!userId,
    user,
    isLoaded: true
  };
}

export function SignIn(props: any) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelectPersona = async (persona: typeof DEMO_PERSONAS[0]) => {
    setLoadingId(persona.id);
    const res = await loginAsMockUser(
      persona.id,
      persona.name,
      persona.email,
      persona.role,
      persona.societyName
    );
    if (res.success) {
      window.location.href = "/feed";
    } else {
      alert("Failed to log in: " + res.error);
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 backdrop-blur-xl shadow-2xl text-center space-y-6">
      <div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mx-auto mb-4">
          <span className="text-white font-extrabold text-2xl">M</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight dark:text-zinc-50">Mohalla Local Preview</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
          Clerk is currently bypassed. Select a preconfigured demo persona to sign in and explore all hyperlocal features.
        </p>
      </div>

      <div className="space-y-4">
        {DEMO_PERSONAS.map((persona) => (
          <button
            key={persona.id}
            onClick={() => handleSelectPersona(persona)}
            disabled={loadingId !== null}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 hover:bg-emerald-500/5 dark:bg-zinc-950 dark:hover:bg-emerald-500/5 text-left transition-all duration-200 group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
              <img
                src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${persona.avatarSeed}`}
                alt={persona.name}
                className="w-8 h-8"
              />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-zinc-200">
                  {persona.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  {persona.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">{persona.description}</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 italic mt-1">Society: {persona.societyName}</p>
            </div>
            {loadingId === persona.id && (
              <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin self-center" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SignUp(props: any) {
  return <SignIn {...props} />;
}

export function UserButton() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    await logoutMockUser();
    window.location.href = "/";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden hover:opacity-90 transition shadow cursor-pointer"
      >
        <img src={user.imageUrl} alt={user.fullName} className="w-7 h-7" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-12 left-0 md:bottom-auto md:top-10 md:left-auto md:right-0 w-56 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xl z-50 text-left space-y-3">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">{user.primaryEmailAddress.emailAddress}</p>
            </div>
            <hr className="border-slate-200 dark:border-zinc-800" />
            <button
              onClick={handleSignOut}
              className="w-full text-left text-xs font-bold text-red-500 hover:text-red-400 transition cursor-pointer"
            >
              Sign Out (Mock)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function SignInButton({ children }: { children?: React.ReactNode }) {
  const handleRedirect = () => {
    window.location.href = "/sign-in";
  };
  
  if (children) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: handleRedirect });
  }
  return <button onClick={handleRedirect}>Sign In</button>;
}

export function SignUpButton({ children }: { children?: React.ReactNode }) {
  const handleRedirect = () => {
    window.location.href = "/sign-up";
  };

  if (children) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: handleRedirect });
  }
  return <button onClick={handleRedirect}>Sign Up</button>;
}

export function SignOutButton({ children }: { children?: React.ReactNode }) {
  const handleSignOut = async () => {
    await logoutMockUser();
    window.location.href = "/";
  };

  if (children) {
    return React.cloneElement(children as React.ReactElement<any>, { onClick: handleSignOut });
  }
  return <button onClick={handleSignOut}>Sign Out</button>;
}
