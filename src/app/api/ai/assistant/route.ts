import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { classifyIntent } from "@/lib/ai-intent";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Gated society standard regulations context
const COMMUNITY_GUIDELINES = `
  - Garbage Collection: Door-to-door waste collection is scheduled daily at 9:00 AM. Residents must separate wet waste (green bin) and dry waste (blue bin). Hazardous or e-waste must be dropped off directly at the main waste sorting station near Block C.
  - Visitor Policy: All visitors, courier agents, and delivery partners must register via MyGate/security desk at the main gate. Delivery agents are not allowed inside residential towers after 10:00 PM.
  - Parking Regulations: Parking in driveway lanes or open common areas is strictly prohibited. Each resident is allocated one basement slot. Visitors must park in designated open slots with token slips. Towing charges apply for violations.
  - Maid & Helper Registry: Housekeepers, cooks, and drivers must obtain verification badges from the Society Admin Office. Operating hours are from 7:00 AM to 9:00 PM.
  - Silent Hours: Quiet hours are enforced between 10:30 PM and 7:00 AM. Late-night celebrations or music require advance permission from Block Directors.
  - Emergency Contacts: Security Desk: +91 80 5555 1212. Society Admin Office: +91 80 5555 1313. Local Fire Station: 101. Hospital Ambulance: 102.
`;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { question } = await req.json();
    if (!question || !question.trim()) {
      return new Response("Question is required", { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { location: true },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    if (!user.locationId) {
      return NextResponse.json({
        error: "Please complete your location setup before using the assistant."
      }, { status: 400 });
    }

    const societyName = user.societyName || "your local area";
    const userName = user.name || "Resident";
    const area = user.location?.area || "your neighborhood";

    const intent = classifyIntent(question);
    console.log(`[AI Assistant API] Intent: ${intent}`);

    let contextData: any = null;
    let dataContext = "";
    let sources: Array<{ type: string; name: string }> = [];

    // Query DB context based on classified intent
    switch (intent) {
      case 'LOCAL_BUSINESS':
        contextData = await db.businessProfile.findMany({
          where: { locationId: user.locationId },
          orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
          take: 5,
          select: { name: true, category: true, contactPhone: true, description: true }
        });
        if (contextData && contextData.length > 0) {
          dataContext = "\n\n**Local Businesses in Your Area:**\n";
          contextData.forEach((b: any, idx: number) => {
            dataContext += `${idx + 1}. **${b.name}** (${b.category})\n`;
            if (b.description) dataContext += `   - ${b.description}\n`;
            sources.push({ type: "BUSINESS", name: b.name });
          });
        }
        break;

      case 'LOCAL_SERVICE':
        contextData = await db.serviceProfile.findMany({
          where: { locationId: user.locationId },
          orderBy: [{ isVerified: 'desc' }, { pricingRate: 'asc' }],
          take: 5,
          select: { title: true, category: true, pricingRate: true, pricingUnit: true, description: true }
        });
        if (contextData && contextData.length > 0) {
          dataContext = "\n\n**Service Providers in Your Area:**\n";
          contextData.forEach((s: any, idx: number) => {
            dataContext += `${idx + 1}. **${s.title}** (${s.category}) - ₹${s.pricingRate} ${s.pricingUnit || ''}\n`;
            sources.push({ type: "SERVICE", name: s.title });
          });
        }
        break;

      case 'UPCOMING_EVENT':
        contextData = await db.event.findMany({
          where: { locationId: user.locationId, status: 'UPCOMING' },
          orderBy: { startDate: 'asc' },
          take: 5,
          select: { title: true, description: true, startDate: true }
        });
        if (contextData && contextData.length > 0) {
          dataContext = "\n\n**Upcoming Events in Your Area:**\n";
          contextData.forEach((e: any, idx: number) => {
            const dateStr = new Date(e.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            dataContext += `${idx + 1}. **${e.title}** on ${dateStr}\n`;
            sources.push({ type: "EVENT", name: e.title });
          });
        }
        break;
    }

    const encoder = new TextEncoder();

    // Create ReadableStream to send text chunks to client
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!GEMINI_API_KEY) {
            // Local fallback simulation with typing delay
            const fallback = runLocalFallback(question, societyName, userName, dataContext);
            const words = fallback.answer.split(" ");
            for (const word of words) {
              controller.enqueue(encoder.encode(word + " "));
              await new Promise(r => setTimeout(r, 45));
            }
            // Send metadata payload
            controller.enqueue(encoder.encode(`\n\n__METADATA__${JSON.stringify({ sources })}`));
            controller.close();
            return;
          }

          const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          const systemContext = `You are "Mohalla AI", the premium local assistant for the community in ${area}, ${societyName}.
The resident asking the question is named "${userName}".
Your location context: ${area} area in ${user.location?.city || 'the city'}.`;

          const prompt = `${systemContext}

${dataContext || ''}

Using the community guidelines and live data above, formulate a friendly, helpful, and concise answer to their question.
If their question is unrelated to society rules, local businesses, services, or neighborhood topics, politely tell them you specialize in neighborhood community queries.

Community Guidelines:
${COMMUNITY_GUIDELINES}

Resident's Question: "${question}"

Provide a helpful, concise answer (3-4 sentences max). If you found relevant businesses, services, or events in the data above, reference them specifically. Use clean markdown.`;

          const resultStream = await model.generateContentStream(prompt);
          for await (const chunk of resultStream.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }

          // Append metadata payload
          controller.enqueue(encoder.encode(`\n\n__METADATA__${JSON.stringify({ sources })}`));
          controller.close();
        } catch (err) {
          console.error("[Streaming Assistant Stream Error]:", err);
          controller.enqueue(encoder.encode("I encountered a hiccup while crafting my response. Please check your network or try asking again."));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    console.error("[Streaming Assistant Route Handler Error]:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * Local rules engine fallback matching when API keys are unavailable
 */
function runLocalFallback(question: string, societyName: string, userName: string, dataContext: string) {
  const lowerQ = question.toLowerCase();
  let answer = `Hello ${userName}! I am the Mohalla AI Assistant for ${societyName}.`;

  if (dataContext) {
    answer += dataContext + "\n\n";
  }

  if (lowerQ.includes("garbage") || lowerQ.includes("waste") || lowerQ.includes("trash")) {
    answer += "\n\n♻️ **Garbage Collection Policy**:\n- Collection is scheduled daily at **9:00 AM** at your doorstep.\n- Please separate wet waste (green bin) and dry waste (blue bin).\n- E-waste must be dropped at the main sorting station near Block C.";
  } else if (lowerQ.includes("park") || lowerQ.includes("car") || lowerQ.includes("vehicle")) {
    answer += "\n\n🚗 **Parking Guidelines**:\n- Parking is only allowed in your designated basement slot.\n- Driving lanes must remain clear at all times.\n- Visitors must park in designated slots after registering at the security gate.";
  } else if (lowerQ.includes("visitor") || lowerQ.includes("delivery") || lowerQ.includes("guest")) {
    answer += "\n\n👤 **Visitor Policy**:\n- All visitors and delivery staff must register at the main gate using security tokens.\n- Delivery partners are restricted from residential blocks after **10:00 PM** for resident safety.";
  } else if (lowerQ.includes("maid") || lowerQ.includes("helper") || lowerQ.includes("cook")) {
    answer += "\n\n🧹 **Maids & Helpers Registry**:\n- Domestic helpers, cooks, and drivers must obtain verification badges from the Society Admin office.\n- Access hours are restricted between **7:00 AM and 9:00 PM**.";
  } else if (lowerQ.includes("contact") || lowerQ.includes("phone") || lowerQ.includes("number") || lowerQ.includes("help")) {
    answer += "\n\n📞 **Emergency Directory**:\n- Security Desk: +91 80 5555 1212\n- Society Management Office: +91 80 5555 1313\n- Medical Emergency/Ambulance: 102 / 108";
  } else if (lowerQ.includes("silent") || lowerQ.includes("music") || lowerQ.includes("party") || lowerQ.includes("noise")) {
    answer += "\n\n🤫 **Silent Hours**:\n- Quiet hours are active from **10:30 PM to 7:00 AM**.\n- Late-night celebrations in common areas require advance booking with the Society Block Directors.";
  } else if (!dataContext) {
    answer += " You can ask me about parking regulations, garbage schedules, helper registry cards, noise rules, security desk numbers, local businesses, services, or upcoming events. How can I help you today?";
  }

  return { answer };
}
