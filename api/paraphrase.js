export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, mode } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const modeInstructions = {
    standard: 'Paraphrase the text while keeping the original meaning. Use different words and sentence structure.',
    fluency: 'Rewrite the text to improve its natural flow and readability.',
    creative: 'Rewrite the text creatively with fresh vocabulary and unique phrasing.',
    formal: 'Rewrite the text in a formal, professional, and academic style.',
    simple: 'Rewrite the text using simpler words and shorter sentences.'
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `${modeInstructions[mode] || modeInstructions.standard}

Provide 3 different paraphrased versions.

IMPORTANT: Return ONLY a raw JSON object. No markdown, no backticks, no explanation. Just pure JSON.

Format: {"variations":["version 1 here","version 2 here","version 3 here"]}

Text: ${text}`
        }]
      })
    });

    const data = await response.json();
    let content = data.content[0].text.trim();
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch(e) {
      result = { variations: [content] };
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
