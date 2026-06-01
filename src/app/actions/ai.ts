"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { classifyIntent } from "@/lib/ai-intent";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Gated society standard regulations context
const COMMUNITY_GUIDELINES = `
  - Garbage Collection: Door-to-door waste collection is scheduled daily at 9:00 AM. Residents must separate wet waste (green bin) and dry waste (blue bin). Hazardous or e-waste must be dropped off directly at the main waste sorting station near Block C.
  - Visitor Policy: All visitors, courier agents, and delivery partners must register via MyGate/security desk at the main gate. Delivery agents are not allowed inside residential towers after 10:00 PM.
  - Parking Regulations: Parking in driveway lanes or open common areas is strictly prohibited. Each resident is allocated one basement slot. Visitors must park in designated open slots with token slips. Towing charges apply for violations.
  - Maid & Helper Registry: Housekeepers, cooks, and drivers must obtain verification badges from the Society Admin Office. Operating hours are from 7:00 AM to 9:00 PM.
  - Silent Hours: Quiet hours are enforced between 10:30 PM and 7:00 AM. Late-night celebrations or music require advance permission from Block Directors.
  - Emergency Contacts: Security Desk: +91 80 5555 1212. Society Admin Office: +91 80 5555 1313. Local Fire Station: 101. Hospital Ambulance: 102.
`;

/**
 * Handles user inquiries to the AI Community Assistant with database-powered context
 */
export async function askCommunityAssistantAction(question: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { location: true },
  });

  if (!user) throw new Error("User not found");

  // Check if user has location set
  if (!user.locationId) {
    return {
      success: false,
      answer: "Please complete your location setup before using the assistant. Go to Settings to add your location."
    };
  }

  const societyName = user.societyName || "your local area";
  const userName = user.name || "Resident";
  const area = user.location?.area || "your neighborhood";

  // Classify the intent
  const intent = classifyIntent(question);
  console.log(`[AI Assistant] Intent classified as: ${intent}`);

  // Fetch context data based on intent
  let contextData: any = null;
  let dataContext = '';

  try {
    switch (intent) {
      case 'LOCAL_BUSINESS':
        contextData = await db.businessProfile.findMany({
          where: { locationId: user.locationId },
          orderBy: [
            { isVerified: 'desc' },
            { createdAt: 'desc' }
          ],
          take: 10,
          select: {
            name: true,
            category: true,
            contactPhone: true,
            contactEmail: true,
            isVerified: true,
            description: true
          }
        });

        if (contextData && contextData.length > 0) {
          dataContext = '\n\n**Local Businesses in Your Area:**\n';
          contextData.forEach((business: any, idx: number) => {
            dataContext += `${idx + 1}. **${business.name}** (${business.category})${business.isVerified ? ' ✓ Verified' : ''}\n`;
            if (business.description) dataContext += `   - ${business.description}\n`;
            if (business.contactPhone) dataContext += `   - Phone: ${business.contactPhone}\n`;
            if (business.contactEmail) dataContext += `   - Email: ${business.contactEmail}\n`;
          });
        } else {
          dataContext = '\n\n**Note:** No local businesses have been listed in your area yet. Encourage local businesses to join Mohalla!';
        }
        break;

      case 'LOCAL_SERVICE':
        contextData = await db.serviceProfile.findMany({
          where: { locationId: user.locationId },
          orderBy: [
            { isVerified: 'desc' },
            { pricingRate: 'asc' }
          ],
          take: 10,
          select: {
            title: true,
            category: true,
            pricingRate: true,
            pricingUnit: true,
            isVerified: true,
            description: true,
            availability: true
          }
        });

        if (contextData && contextData.length > 0) {
          dataContext = '\n\n**Service Providers in Your Area:**\n';
          contextData.forEach((service: any, idx: number) => {
            dataContext += `${idx + 1}. **${service.title}** (${service.category})${service.isVerified ? ' ✓ Verified' : ''}\n`;
            if (service.description) dataContext += `   - ${service.description}\n`;
            if (service.pricingRate) dataContext += `   - Price: ₹${service.pricingRate} ${service.pricingUnit || ''}\n`;
            if (service.availability) dataContext += `   - Available: ${service.availability}\n`;
          });
        } else {
          dataContext = '\n\n**Note:** No service providers have been listed in your area yet.';
        }
        break;

      case 'UPCOMING_EVENT':
        contextData = await db.event.findMany({
          where: {
            locationId: user.locationId,
            status: 'UPCOMING'
          },
          orderBy: { startDate: 'asc' },
          take: 5,
          select: {
            title: true,
            description: true,
            startDate: true,
            organizer: {
              select: { name: true }
            }
          }
        });

        if (contextData && contextData.length > 0) {
          dataContext = '\n\n**Upcoming Events in Your Area:**\n';
          contextData.forEach((event: any, idx: number) => {
            const date = new Date(event.startDate).toLocaleDateString('en-IN', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            dataContext += `${idx + 1}. **${event.title}** - ${date}\n`;
            if (event.description) dataContext += `   - ${event.description}\n`;
            if (event.organizer?.name) dataContext += `   - Organized by: ${event.organizer.name}\n`;
          });
        } else {
          dataContext = '\n\n**Note:** No upcoming events scheduled in your area yet.';
        }
        break;
    }
  } catch (error) {
    console.error('[AI Assistant] Database query error:', error);
    // Continue with empty context if query fails
  }

  // Use Gemini AI if available
  if (!genAI) {
    return runLocalAIFallback(question, societyName, userName, dataContext);
  }

  try {
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

Provide a helpful, concise answer (3-4 sentences max). If you found relevant businesses, services, or events in the data above, reference them specifically.`;

    const result = await model.generateContent(prompt);
    return { success: true, answer: result.response.text() };
  } catch (err) {
    console.error("Gemini AI Assistant error, running local fallback:", err);
    return runLocalAIFallback(question, societyName, userName, dataContext);
  }
}

/**
 * Rule-based fallback parsing for assistant questions
 */
function runLocalAIFallback(question: string, societyName: string, userName: string, dataContext?: string) {
  const lowerQ = question.toLowerCase();

  let answer = `Hello ${userName}! I am the Mohalla AI Assistant for ${societyName}.`;

  // Add data context if available
  if (dataContext) {
    answer += dataContext + "\n\n";
  }

  // Rule-based responses
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

  return { success: true, answer };
}
