import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const generateResponse = async (req: AuthRequest, res: Response) => {
  const { prompt, systemPrompt, model = 'llama-3.3-70b-versatile' } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ 
      error: 'AI service not configured', 
      message: 'The Groq API key is missing on the server. Please set GROQ_API_KEY in your Render environment.' 
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
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        // Fallback if body is not JSON
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
