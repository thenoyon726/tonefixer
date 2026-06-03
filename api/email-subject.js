export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { content, audience, type } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

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
          content: `Generate 5 compelling email subject lines for a ${type} email.

Email content: ${content}
${audience ? `Target audience: ${audience}` : ''}

Generate exactly 5 subject lines with different styles: urgent, friendly, professional, creative, question.

IMPORTANT: Return ONLY raw JSON, no markdown, no backticks.

Format: {"subjects":[{"subject":"subject line here","style":"urgent"},{"subject":"subject line here","style":"friendly"},{"subject":"subject line here","style":"professional"},{"subject":"subject line here","style":"creative"},{"subject":"subject line here","style":"question"}]}`
        }]
      })
    });

    const data = await response.json();
    let content_text = data.content[0].text.trim();
    content_text = content_text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let result;
    try { result = JSON.parse(content_text); }
    catch(e) { result = { subjects: [] }; }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
