export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

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
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Fix all grammar, spelling, and punctuation errors in the following text.

Return your response in this exact JSON format (no markdown, no backticks):
{
  "fixed": "the corrected text here",
  "corrections": [
    {"type": "grammar|spelling|punctuation|style", "original": "wrong text", "fixed": "correct text", "explanation": "brief explanation"}
  ]
}

If the text has no errors, return the original text and an empty corrections array.

Text to fix:
${text}`
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;

    let result;
    try {
      result = JSON.parse(content);
    } catch(e) {
      result = { fixed: content, corrections: [] };
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
