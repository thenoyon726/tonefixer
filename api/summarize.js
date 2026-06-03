export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, length } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const lengthInstructions = {
    short: 'Write a very short summary in 2-3 sentences only.',
    medium: 'Write a medium summary in one paragraph (4-6 sentences).',
    detailed: 'Write a detailed summary with the main points. Also extract 4-6 key bullet points.'
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
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `${lengthInstructions[length] || lengthInstructions.short}

Return your response in this exact JSON format (no markdown, no backticks):
{
  "summary": "your summary here",
  "keypoints": ["point 1", "point 2", "point 3"]
}

For short and medium summaries, keypoints can be an empty array.

Text to summarize:
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
      result = { summary: content, keypoints: [] };
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
