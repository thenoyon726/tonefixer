export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { recipient, situation, impact, remedy, situationType } = req.body;
  if (!recipient || !situation) return res.status(400).json({ error: 'Missing required fields' });

  const typeInstructions = {
    professional: 'Write a professional apology suitable for a work or business context.',
    personal: 'Write a warm, heartfelt personal apology for a friend or family member.',
    customer: 'Write a customer service apology that is empathetic and solution-focused.',
    formal: 'Write a formal, official apology letter with proper structure.'
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
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Write a sincere apology letter with these details:

To: ${recipient}
What happened: ${situation}
${impact ? `How it affected them: ${impact}` : ''}
${remedy ? `What I will do to make it right: ${remedy}` : ''}

${typeInstructions[situationType] || typeInstructions.professional}

Write a genuine, heartfelt apology (200-280 words) that:
- Clearly acknowledges what happened
- Takes full responsibility without excuses
- Shows empathy for how they were affected
- Commits to making it right
- Ends with a sincere closing

IMPORTANT: Return ONLY raw JSON, no markdown, no backticks.
Format: {"letter": "the complete apology letter here"}`
        }]
      })
    });

    const data = await response.json();
    let content = data.content[0].text.trim();
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let result;
    try { result = JSON.parse(content); }
    catch(e) { result = { letter: content }; }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
