export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { prompt, year, month } = body;

    if (!prompt || !year || !month) {
      return res.status(400).json({ error: 'Missing required parameters: prompt, year, month' });
    }

    const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6JKinsY86LZmNCmGAJpa2QaRg-IfhQmIJCJpdxsNmWc0A';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const systemInstruction = `You are a professional content calendar assistant.
Analyze the user's input ideas, scripts, schedule, or notes, and generate a structured content calendar for the month: ${year}-${String(month).padStart(2, '0')}.
Format the output as a JSON array of objects. Do not include markdown code block formatting like \`\`\`json. Return ONLY the raw JSON string.

Each object in the array must have the following structure:
{
  "date": "YYYY-MM-DD", // Must be a valid date in the month ${year}-${String(month).padStart(2, '0')}
  "name": "Catchy Title", // Keep it short and professional, no bold/italic formatting
  "type": "static" | "carousel" | "reel" | "text", // Match the most appropriate content type
  "summary": "Short description of the content piece",
  "caption": "The actual post caption to be published" // Write a complete, high-quality caption. DO NOT use any markdown asterisks like * or ** for bold. Use plain text with line breaks and emojis if suitable.
}

Ensure all dates fall exactly within the month ${year}-${String(month).padStart(2, '0')}. Spread them out reasonably unless the input specifies exact dates.`;

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error && (parsed.error.status === 'RESOURCE_EXHAUSTED' || parsed.error.code === 429)) {
          throw new Error('Gemini API Quota Exceeded: The shared free-tier key has reached its limit (20 requests/day). Please try again shortly or configure a custom GEMINI_API_KEY environment variable.');
        }
        throw new Error(parsed.error.message || errText);
      } catch (e) {
        if (e.message.startsWith('Gemini API Quota Exceeded')) {
          throw e;
        }
        throw new Error(`Gemini API error: ${errText}`);
      }
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates[0].content.parts[0].text;

    const items = JSON.parse(responseText.trim());
    return res.status(200).json({ success: true, items });
  } catch (err) {
    console.error('Error generating AI content:', err);
    return res.status(500).json({ error: err.message });
  }
}
