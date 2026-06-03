export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { jobTitle, companyName, skills, yourName, whyCompany, tone } = req.body;
  if (!jobTitle || !companyName || !skills) return res.status(400).json({ error: 'Missing required fields' });

  const toneInstructions = {
    professional: 'Write in a formal, professional tone.',
    confident: 'Write in a confident, assertive tone that highlights achievements boldly.',
    friendly: 'Write in a warm, friendly tone that shows personality.',
    enthusiastic: 'Write in an enthusiastic, passionate tone that shows genuine excitement.'
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
          content: `Write a professional cover letter for the following:

Job Title: ${jobTitle}
Company: ${companyName}
${yourName ? `Applicant Name: ${yourName}` : ''}
Skills & Experience: ${skills}
${whyCompany ? `Why this company: ${whyCompany}` : ''}

${toneInstructions[tone] || toneInstructions.professional}

Write a complete cover letter with:
- Opening paragraph (express interest and highlight top qualification)
- Middle paragraph (specific skills and relevant experience)
- Closing paragraph (call to action)

Keep it concise (250-350 words). Make it compelling and personalized.

IMPORTANT: Return ONLY raw JSON, no markdown, no backticks.
Format: {"letter": "the complete cover letter text here"}`
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
