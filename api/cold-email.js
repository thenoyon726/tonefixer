export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { senderName, recipientName, recipientCompany, goal, value, tone } = req.body;
  if (!recipientName || !goal || !value) return res.status(400).json({ error: 'Missing required fields' });

  const toneInstructions = {
    professional: 'Write in a professional and direct tone.',
    friendly: 'Write in a friendly and warm tone.',
    confident: 'Write in a confident and bold tone.',
    casual: 'Write in a casual and conversational tone.'
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
          content: `Write an effective cold email with the following details:

${senderName ? `Sender: ${senderName}` : ''}
Recipient: ${recipientName}
${recipientCompany ? `Company: ${recipientCompany}` : ''}
Goal: ${goal}
Value/Offer: ${value}
Tone: ${toneInstructions[tone] || toneInstructions.professional}

Write a concise cold email (150-200 words) with:
- Attention-grabbing subject line
- Personalized opening
- Clear value proposition
- Specific call to action
- Professional sign-off

IMPORTANT: Return ONLY raw JSON, no markdown, no backticks.
Format: {"email": "Subject: [subject line here]\\n\\n[email body here]"}`
        }]
      })
    });

    const data = await response.json();
    let content = data.content[0].text.trim();
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let result;
    try { result = JSON.parse(content); }
    catch(e) { result = { email: content }; }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
