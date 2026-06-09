import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("[Clerk Webhook] Missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Verify required headers are present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("[Clerk Webhook] Missing svix headers");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[Clerk Webhook] Verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const eventType = evt.type;

  try {
    // Handle user.created and user.updated
    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

      // Get primary email
      const emailObject = email_addresses?.[0];
      const email = emailObject?.email_address;
      const isEmailVerified = emailObject?.verification?.status === "verified";

      if (!email) {
        console.error("[Clerk Webhook] User has no email address");
        return NextResponse.json(
          { error: "No email address" },
          { status: 400 }
        );
      }

      const name = [first_name, last_name].filter(Boolean).join(" ") || username || "Mohalla Resident";

      await db.user.upsert({
        where: { id },
        update: {
          email,
          name,
          avatar: image_url || null,
          emailVerified: isEmailVerified,
        },
        create: {
          id,
          email,
          name,
          avatar: image_url || null,
          emailVerified: isEmailVerified,
          trustScore: 100,
          points: 0,
        },
      });

      console.log(`[Clerk Webhook] User ${eventType === 'user.created' ? 'created' : 'updated'}: ${id}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Handle user.deleted
    if (eventType === "user.deleted") {
      const { id, deleted } = evt.data;

      if (!id || !deleted) {
        console.error("[Clerk Webhook] Invalid deletion payload");
        return NextResponse.json(
          { error: "Invalid deletion payload" },
          { status: 400 }
        );
      }

      await db.user.delete({
        where: { id },
      });

      console.log(`[Clerk Webhook] User deleted: ${id}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // All other event types
    console.log(`[Clerk Webhook] Received ${eventType} event`);
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error("[Clerk Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
