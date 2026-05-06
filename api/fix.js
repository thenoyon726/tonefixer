export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { text, tone } = req.body;
  if (!text || !tone) {
    return res.status(400).json({ error: 'Missing text or tone' });
  }
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
          content: `You are a professional tone rewriter. Rewrite the following text in a ${tone} tone. Keep the same meaning. Detect the language and respond in the same language. Output ONLY the rewritten text.\n\nText:\n${text}`
        }]
      })
    });
    const data = await response.json();
    const result = data.content?.map(c => c.text || '').join('') || 'Error occurred';
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}
