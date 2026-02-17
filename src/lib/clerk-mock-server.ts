import { db } from "@/lib/db";

export type WebhookEvent = 
  | {
      type: "user.created" | "user.updated";
      data: {
        id: string;
        email_addresses: Array<{
          email_address: string;
          verification?: { status: string };
        }>;
        image_url?: string;
        first_name?: string;
        last_name?: string;
        username?: string;
      };
    }
  | {
      type: "user.deleted";
      data: {
        id?: string;
        deleted?: boolean;
      };
    }
  | {
      type: string;
      data: any;
    };

const DEMO_PERSONAS = [
  {
    id: "user_samarth",
    name: "Samarth Shekhar",
    email: "shekharsamarth1574@gmail.com",
    role: "USER" as const,
    societyName: "Gaur City 2",
    avatarSeed: "samarth",
  },
  {
    id: "user_karan",
    name: "Karan Sharma",
    email: "karan@mohalla.in",
    role: "MODERATOR" as const,
    societyName: "Indiranagar Block A",
    avatarSeed: "karan",
  },
  {
    id: "user_aditi",
    name: "Aditi Patel",
    email: "aditi@mohalla.in",
    role: "ADMIN" as const,
    societyName: "Prestige Tech Park",
    avatarSeed: "aditi",
  }
];

export async function auth() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const userId = cookieStore.get("mohalla_mock_user_id")?.value;
  return { userId: userId || null };
}

export async function currentUser() {
  const { userId } = await auth();
  if (!userId) return null;
  
  const persona = DEMO_PERSONAS.find(p => p.id === userId) || DEMO_PERSONAS[0];
  
  return {
    id: userId,
    firstName: persona.name.split(" ")[0],
    lastName: persona.name.split(" ")[1] || "",
    imageUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${persona.avatarSeed}`,
    emailAddresses: [{ emailAddress: persona.email }]
  };
}
