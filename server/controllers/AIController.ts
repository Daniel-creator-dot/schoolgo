import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import pool from '../db.ts';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const generateResponse = async (req: AuthRequest, res: Response) => {
  const { prompt, systemPrompt, model = 'llama-3.3-70b-versatile' } = req.body;
  let apiKey = process.env.GROQ_API_KEY;

  // Try to find organization-specific key in database
  try {
    const orgId = req.user.org_id;
    if (orgId) {
      const dbResult = await pool.query('SELECT api_key FROM gemini_api_keys WHERE org_id = $1', [orgId]);
      if (dbResult.rows.length > 0 && dbResult.rows[0].api_key) {
        apiKey = dbResult.rows[0].api_key;
      }
    }
  } catch (dbErr) {
    console.warn('Failed to fetch org-specific AI key, falling back to env:', dbErr);
  }

  if (!apiKey) {
    const orgId = req.user?.org_id;
    return res.status(503).json({ 
      error: 'AI service not configured', 
      message: `No Groq API key found in settings or environment. (Org ID: ${orgId || 'None'})`,
      instruction: 'Please go to School Admin > Settings and save your Groq API Key.'
    });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt || 'You are helpful assistant for OmniPortal school management system.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      let errorMsg = 'AI service unavailable';
      const responseText = await response.text();
      try {
        const errorData = JSON.parse(responseText);
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (e) {
        errorMsg = responseText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    res.json({ text: content });
  } catch (err: any) {
    console.error('Groq AI Proxy Error:', err);
    res.status(500).json({ error: 'AI processing failed', message: err.message });
  }
};
