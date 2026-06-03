export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { content, platform, vibe, includeHashtags } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const platformGuidelines = {
    'Instagram': 'Instagram caption (can be longer, emoji-friendly, storytelling works well)',
    'LinkedIn': 'LinkedIn post (professional tone, thought leadership, no excessive emojis)',
    'Twitter/X': 'Twitter/X tweet (concise, under 280 characters, punchy)',
    'Facebook': 'Facebook post (conversational, community-focused)',
    'TikTok': 'TikTok caption (short, trendy, fun, use relevant emojis)'
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
          content: `Generate 3 social media captions for ${platformGuidelines[platform] || platform}.

Post topic: ${content}
Vibe/Style: ${vibe}
${includeHashtags ? 'Include relevant hashtags for each caption.' : 'No hashtags needed.'}

Generate 3 different caption styles: one short & punchy, one medium with storytelling, one with a hook/question.

IMPORTANT: Return ONLY raw JSON, no markdown, no backticks.

Format: {"captions":[{"style":"Short & Punchy","caption":"caption text here","hashtags":"#tag1 #tag2 #tag3"},{"style":"Story","caption":"caption text here","hashtags":"#tag1 #tag2"},{"style":"Hook","caption":"caption text here","hashtags":"#tag1 #tag2"}]}`
        }]
      })
    });

    const data = await response.json();
    let content_text = data.content[0].text.trim();
    content_text = content_text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let result;
    try { result = JSON.parse(content_text); }
    catch(e) { result = { captions: [] }; }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
