import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize the Gemini API client safely
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export type ModerationStatus = "APPROVED" | "FLAGGED_SPAM" | "FLAGGED_TOXIC" | "FLAGGED_SCAM";

interface ModerationResult {
  status: ModerationStatus;
  reason: string | null;
}

/**
 * Moderates user content for spam, toxicity, or safety.
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return { status: "APPROVED", reason: null };
  }

  // Fallback if no API key is provided
  if (!genAI) {
    return runLocalModerationFallback(text);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an AI moderator for "Mohalla", India's neighborhood social network.
      Analyze the text below and classify it into one of these categories:
      - APPROVED: Safe and positive community post.
      - FLAGGED_SPAM: Irrelevant advertising, repetitiveness, or excessive promotional links.
      - FLAGGED_TOXIC: Abuse, hate speech, threats, harassment, or severe insults.
      - FLAGGED_SCAM: Fraudulent financial schemes, lottery scams, or suspicious requests for money.

      Text to analyze: "${text}"

      Respond in strictly JSON format matching this schema:
      {
        "status": "APPROVED" | "FLAGGED_SPAM" | "FLAGGED_TOXIC" | "FLAGGED_SCAM",
        "reason": "Brief explanation of classification or null if APPROVED"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON safely
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      status: parsed.status || "APPROVED",
      reason: parsed.reason || null,
    };
  } catch (error) {
    console.error("Gemini moderation failed, falling back to local check:", error);
    return runLocalModerationFallback(text);
  }
}

/**
 * Evaluates marketplace listings to filter out UPI fraud, unrealistic deals, or counterfeit listings.
 */
export async function evaluateMarketplaceListing(
  title: string,
  description: string,
  price: number
): Promise<{ status: "APPROVED" | "FLAGGED_SCAM", reason: string | null }> {
  const fullText = `${title} ${description}`;

  if (!genAI) {
    const localCheck = runLocalModerationFallback(fullText);
    if (localCheck.status === "FLAGGED_SCAM") {
      return { status: "FLAGGED_SCAM", reason: localCheck.reason };
    }
    return { status: "APPROVED", reason: null };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an AI scam detector for "Mohalla", India's neighborhood marketplace.
      Analyze the listing below for potential scams:
      - Look for UPI refund fraud indicators (e.g. asking to scan QR codes to receive money).
      - Look for unrealistic pricing (e.g. brand new iPhone for 5,000 INR).
      - Look for advance payment scams (e.g. demanding payment before showing the item).

      Listing Title: "${title}"
      Listing Description: "${description}"
      Price: ${price} INR

      Respond in strictly JSON format matching this schema:
      {
        "status": "APPROVED" | "FLAGGED_SCAM",
        "reason": "Brief explanation of suspicious triggers or null if APPROVED"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      status: parsed.status || "APPROVED",
      reason: parsed.reason || null,
    };
  } catch (error) {
    console.error("Gemini marketplace scan failed:", error);
    return { status: "APPROVED", reason: null };
  }
}

/**
 * Local fallback rule check for moderation.
 */
function runLocalModerationFallback(text: string): ModerationResult {
  const lowerText = text.toLowerCase();
  
  // Toxicity keywords
  const toxicKeywords = ["bastard", "idiot", "motherfucker", "asshole", "fool", "mc", "bc", "scamster", "scumbag"];
  for (const keyword of toxicKeywords) {
    if (lowerText.includes(keyword)) {
      return { status: "FLAGGED_TOXIC", reason: `Contains blocked language or keyword: ${keyword}` };
    }
  }

  // Scam / UPI fraud keywords
  const scamKeywords = [
    "whatsapp to double", "earn money from home", "gpay qr code", "pay advance", 
    "send upi pin", "lottery winner", "free money", "scan qr code to receive", "invest 1000 earn"
  ];
  for (const keyword of scamKeywords) {
    if (lowerText.includes(keyword)) {
      return { status: "FLAGGED_SCAM", reason: `Matches high-risk fraud trigger: ${keyword}` };
    }
  }

  // Spam keywords
  const spamKeywords = ["buy cheap followers", "visit my casino", "slot machine jackpots", "seo ranking service"];
  for (const keyword of spamKeywords) {
    if (lowerText.includes(keyword)) {
      return { status: "FLAGGED_SPAM", reason: `Identified as promotional spam: ${keyword}` };
    }
  }

  return { status: "APPROVED", reason: null };
}
