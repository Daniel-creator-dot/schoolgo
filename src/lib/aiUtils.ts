export async function safeAiFetch(url: string, options: RequestInit): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`>>> [AI FETCH] Calling: ${url}`);
    const response = await fetch(url, options);
    const text = await response.text();
    
    console.log(`>>> [AI FETCH] Status: ${response.status}, Raw Length: ${text?.length || 0}`);
    if (text?.length < 100) {
      console.log(`>>> [AI FETCH] Raw Content: "${text}"`);
    }

    // Check if the body is empty
    if (!text || text.trim() === '') {
      if (!response.ok) {
        return { success: false, error: `AI service returned error status ${response.status} with empty response.` };
      }
      return { success: false, error: 'AI service returned an empty response (Status: ' + response.status + ').' };
    }

    // Try to parse as JSON
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      if (!response.ok) {
        return { success: false, error: `AI service error (${response.status}): ${text.substring(0, 100)}...` };
      }
      return { success: false, error: 'AI service returned malformed data.' };
    }

    if (!response.ok) {
      return { 
        success: false, 
        error: json.message || json.error || `AI service returned error status ${response.status}` 
      };
    }

    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error while communicating with AI service.' };
  }
}

export function extractJsonFromAiResponse(aiText: string): any {
  if (!aiText) return null;
  
  // Clean up any extra whitespace
  const text = aiText.trim();
  
  try {
    // Try clean parse first
    return JSON.parse(text);
  } catch (e) {
    // 1. Try to extract from Markdown blocks
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      try {
        return JSON.parse(markdownMatch[1].trim());
      } catch (e2) {
        // Fall through to heuristic if markdown block itself is slightly broken
      }
    }

    // 2. Try to find the first '{' and last '}' or '[' and ']'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = lastBrace;
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = lastBracket;
    }

    if (start !== -1 && end !== -1 && end > start) {
      try {
        const potentialJson = text.substring(start, end + 1);
        // Basic cleaning of trailing commas before closing braces/brackets
        const cleaned = potentialJson
          .replace(/,\s*([\}\]])/g, '$1')
          // Remove potential AI comments if any (simple // version)
          .replace(/\/\/.*$/gm, '');
          
        return JSON.parse(cleaned.trim());
      } catch (e3) {
        console.error('Failed to parse heuristic JSON match:', e3);
      }
    }
    
    return null;
  }
}
