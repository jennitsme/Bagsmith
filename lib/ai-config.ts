import { GoogleGenAI } from '@google/genai';
import type { AppType } from '@/lib/mini-apps';

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart >= 0 && braceEnd > braceStart) return text.slice(braceStart, braceEnd + 1);
  return text.trim();
}

export async function generateConfigWithAI(type: AppType, prompt: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const instruction = `You are a strict crypto mini-app config generator.
Return ONLY valid JSON object, no markdown text.
Type: ${type}
User prompt: ${prompt}

Constraints:
- Output concise config object only.
- Values must be safe for production defaults.
- reward/fee values must be basis points integers.
- Never include secrets/private keys.
`;

  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: instruction,
    config: {
      temperature: 0.2,
      maxOutputTokens: 500,
    },
  });

  const raw = resp.text || '';
  const json = extractJson(raw);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}
