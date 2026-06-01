export type AssistantIntent = 
  | 'SOCIETY_RULES' 
  | 'LOCAL_BUSINESS' 
  | 'LOCAL_SERVICE' 
  | 'UPCOMING_EVENT' 
  | 'GENERAL';

/**
 * Classifies user questions into specific intents for targeted database queries
 * @param question The user's question string
 * @returns The classified intent type
 */
export function classifyIntent(question: string): AssistantIntent {
  const lower = question.toLowerCase();
  
  // Business-related queries
  if (lower.match(/business|shop|store|restaurant|cafe|clinic|gym|doctor|hospital|pharmacy|salon|parlor|market/)) {
    return 'LOCAL_BUSINESS';
  }
  
  // Service-related queries
  if (lower.match(/service|tutor|plumber|electrician|carpenter|cook|maid|helper|driver|cleaner|repair|fix|maintain/)) {
    return 'LOCAL_SERVICE';
  }
  
  // Event-related queries
  if (lower.match(/event|happening|festival|celebration|gathering|meetup|function|program|activity|workshop/)) {
    return 'UPCOMING_EVENT';
  }
  
  // Society rules and regulations
  if (lower.match(/rule|regulation|guideline|policy|parking|garbage|waste|visitor|guest|pet|noise|complaint|timing|hours/)) {
    return 'SOCIETY_RULES';
  }
  
  // Default to general for everything else
  return 'GENERAL';
}

/**
 * Gets a human-readable description of the intent
 * @param intent The classified intent
 * @returns A description string
 */
export function getIntentDescription(intent: AssistantIntent): string {
  switch (intent) {
    case 'LOCAL_BUSINESS':
      return 'Searching local businesses in your area';
    case 'LOCAL_SERVICE':
      return 'Finding service providers nearby';
    case 'UPCOMING_EVENT':
      return 'Looking for upcoming events';
    case 'SOCIETY_RULES':
      return 'Checking community guidelines';
    case 'GENERAL':
      return 'General inquiry';
  }
}
