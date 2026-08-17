function generateFallbackSchedule(prompt, year, month, category = 'social') {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const topics = prompt ? prompt.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean) : [];
  
  if (category === 'written') {
    const defaultArticles = [
      {
        name: topics[0] || 'Deep Dive: AI Trends Shaping Content Creation',
        type: 'blog',
        platform: 'website',
        summary: 'An in-depth guide on adopting AI-driven workflows for modern content teams.',
        richText: '<p>The adoption of artificial intelligence in editorial workflows is revolutionizing content marketing.</p><h3>Key Takeaways:</h3><ul><li>Automate research and outline creation</li><li>Focus on unique human storytelling and insights</li><li>Scale distribution across multiple channels seamlessly</li></ul>',
        caption: 'How AI is reshaping modern content marketing teams in 2026 🚀'
      },
      {
        name: topics[1] || 'Monthly Newsletter: Industry Insights & Tech Highlights',
        type: 'newsletter',
        platform: 'newsletter',
        summary: 'Curated industry breakdown, product changelogs, and team highlights.',
        richText: '<p>Welcome to this month\'s edition! Here is everything you need to know about the latest product updates and industry shifts.</p>',
        caption: 'Your monthly dose of actionable strategies and tech highlights 📬'
      },
      {
        name: topics[2] || 'Case Study: 10x Engagement with Structured Calendars',
        type: 'case-study',
        platform: 'medium',
        summary: 'How leading startups use organized calendar pipelines to drive consistent organic reach.',
        richText: '<p>Consistency is the number one differentiator in content marketing success.</p>',
        caption: 'Case study breakdown: From sporadic posting to 10x organic growth 📈'
      },
      {
        name: topics[3] || 'Weekly Editorial: Building a Sustainable Brand Voice',
        type: 'blog',
        platform: 'website',
        summary: 'Core principles for maintaining consistency across social channels and long-form publications.',
        richText: '<p>Your brand voice is your moat. Here is how to codify and scale it across your entire team.</p>',
        caption: 'Why brand voice consistency matters more than ever in 2026 🎯'
      }
    ];

    return defaultArticles.map((art, idx) => {
      const day = Math.min(daysInMonth, 3 + idx * 7);
      return {
        date: `${monthStr}-${String(day).padStart(2, '0')}`,
        name: art.name,
        type: art.type,
        category: 'written',
        platform: art.platform,
        summary: art.summary,
        richText: art.richText,
        caption: art.caption
      };
    });
  }

  // Social category
  const defaultSocial = [
    {
      name: topics[0] || 'Monthly Kickoff & Vision',
      type: 'static',
      summary: 'Launch graphic highlighting team goals and content themes.',
      caption: `🚀 Welcome to a new month of growth and high-impact content! Let's make every post count. #Codju #Marketing2026`
    },
    {
      name: topics[1] || 'Product Feature Carousel',
      type: 'carousel',
      summary: 'Step-by-step breakdown carousel highlighting core features and user benefits.',
      caption: `Swipe through to see how modern teams organize their content pipeline effortlessly ✨ 👉\n\n1. Plan ahead\n2. Collaborate in real-time\n3. Publish with confidence\n\n#ContentStrategy #Productivity`
    },
    {
      name: topics[2] || 'Behind the Scenes Reel',
      type: 'reel',
      summary: 'Short, engaging video reel taking viewers behind the scenes.',
      caption: `Ever wonder how we build features that keep teams moving fast? Here is a quick BTS look! 🎬✨ #StartupLife #BehindTheScenes`
    },
    {
      name: topics[3] || 'Thought Leadership Breakdown',
      type: 'text',
      summary: 'Bite-sized insight on content scalability and audience growth.',
      caption: `The best content strategies aren't built on volume—they're built on consistency and clarity. What's your top content goal this month? 👇`
    },
    {
      name: topics[4] || 'Community Spotlight & Pro Tips',
      type: 'static',
      summary: 'Actionable tips graphic for creators and digital marketing teams.',
      caption: `💡 Pro-Tip of the Week: High-performing calendars save an average of 15 hours per week on revision cycles. Double tap if you agree!`
    }
  ];

  return defaultSocial.map((post, idx) => {
    const day = Math.min(daysInMonth, 2 + idx * 5);
    return {
      date: `${monthStr}-${String(day).padStart(2, '0')}`,
      name: post.name,
      type: post.type,
      category: 'social',
      summary: post.summary,
      caption: post.caption
    };
  });
}

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

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    body = {};
  }
  const { prompt = '', year = 2026, month = 8, category = 'social' } = body;

  try {
    const fallbackKeys = [
      'AQ.Ab8RN6JKinsY86LZmNCmGAJpa2QaRg-IfhQmIJCJpdxsNmWc0A',
      'AQ.Ab8RN6LFLPrCfwHcBDQ0edSpn4mPid2mc6h4zmaZya3GTWVWug'
    ];
    const userApiKey = process.env.GEMINI_API_KEY;
    const apiKeys = userApiKey ? [userApiKey, ...fallbackKeys] : fallbackKeys;

    const systemInstruction = category === 'written'
      ? `You are a professional editorial content strategist and writer.
Analyze the user's input ideas, topics, outlines, or notes, and generate a structured written content calendar (blogs, website articles, newsletters, medium/substack articles) for the month: ${year}-${String(month).padStart(2, '0')}.
Format the output as a JSON array of objects. Do not include markdown code block formatting like \`\`\`json. Return ONLY the raw JSON string.

Each object in the array must have the following structure:
{
  "date": "YYYY-MM-DD", // Must be a valid date in the month ${year}-${String(month).padStart(2, '0')}
  "name": "Engaging Article / Newsletter Title", // Professional, catchy title, no markdown bold/italic
  "type": "blog" | "newsletter" | "case-study" | "text", // Match the most appropriate written type
  "category": "written",
  "platform": "website" | "medium" | "substack" | "newsletter" | "linkedin",
  "summary": "Short executive summary or outline of the article",
  "richText": "<p>Starter draft introduction or full outline for the written piece</p>",
  "caption": "Short summary or social hook for the article"
}

Ensure all dates fall exactly within the month ${year}-${String(month).padStart(2, '0')}. Spread them out reasonably unless the input specifies exact dates.`
      : `You are a professional social media content calendar assistant.
Analyze the user's input ideas, scripts, schedule, or notes, and generate a structured content calendar for the month: ${year}-${String(month).padStart(2, '0')}.
Format the output as a JSON array of objects. Do not include markdown code block formatting like \`\`\`json. Return ONLY the raw JSON string.

Each object in the array must have the following structure:
{
  "date": "YYYY-MM-DD", // Must be a valid date in the month ${year}-${String(month).padStart(2, '0')}
  "name": "Catchy Title", // Keep it short and professional, no bold/italic formatting
  "type": "static" | "carousel" | "reel" | "text", // Match the most appropriate content type
  "category": "social",
  "summary": "Short description of the content piece",
  "caption": "The actual post caption to be published" // Write a complete, high-quality caption. DO NOT use any markdown asterisks like * or ** for bold. Use plain text with line breaks and emojis if suitable.
}

Ensure all dates fall exactly within the month ${year}-${String(month).padStart(2, '0')}. Spread them out reasonably unless the input specifies exact dates.`;

    let geminiResponse;
    let lastError = null;
    let responseText = '';

    for (const key of apiKeys) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`;
      try {
        geminiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(4000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          responseText = geminiData.candidates[0].content.parts[0].text;
          lastError = null;
          break;
        }

        const errText = await geminiResponse.text();
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error && (parsed.error.status === 'RESOURCE_EXHAUSTED' || parsed.error.code === 429)) {
            lastError = new Error(`Quota Exceeded: ${parsed.error.message}`);
            continue;
          }
          lastError = new Error(parsed.error.message || errText);
        } catch {
          lastError = new Error(`Gemini API error: ${errText}`);
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError || !responseText) {
      const items = generateFallbackSchedule(prompt, year, month, category);
      return res.status(200).json({ success: true, items, fallback: true });
    }

    let items;
    try {
      items = JSON.parse(responseText.trim());
    } catch {
      items = generateFallbackSchedule(prompt, year, month, category);
    }
    return res.status(200).json({ success: true, items });
  } catch (err) {
    console.error('Error generating AI content:', err);
    const items = generateFallbackSchedule(prompt, year, month, category);
    return res.status(200).json({ success: true, items, fallback: true });
  }
}
