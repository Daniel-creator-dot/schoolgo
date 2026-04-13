export async function safeAiFetch(url: string, options: RequestInit): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    // Check if the body is empty
    if (!text || text.trim() === '') {
      if (!response.ok) {
        return { success: false, error: `AI service returned error status ${response.status} with empty response.` };
      }
      return { success: false, error: 'AI service returned an empty response.' };
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
  
  try {
    // Try clean parse first
    return JSON.parse(aiText);
  } catch (e) {
    // Try to find JSON block
    const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/) || aiText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      try {
        const potentialJson = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(potentialJson.trim());
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}
