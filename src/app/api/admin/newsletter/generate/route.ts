import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured. Add it to .env.local' },
        { status: 500 }
      )
    }

    const systemPrompt = `You are a professional email newsletter designer for Crystal Harbor Trading Company, an e-commerce company specializing in custom printed products (blankets, mugs, t-shirts, etc.) with no minimum orders.

Generate a complete, professional HTML email newsletter based on the user's description. Use inline CSS styles only (no external stylesheets).

Brand colors:
- Deep Blue: #1E3A8A (primary)
- Gold: #C4942A (accents, CTAs)
- Silver: #8A9DB8 (secondary text)
- White: #FFFFFF (backgrounds)
- Light Gray: #F8FAFC (section backgrounds)

Guidelines:
- Use a max-width of 600px centered layout
- Include a branded header with "Crystal Harbor Trading Company"
- Professional, warm, and engaging tone
- Include a call-to-action button styled with the gold color
- Include an unsubscribe footer
- Mobile-friendly with inline styles
- Return ONLY the HTML, no explanation or markdown code blocks`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenAI error:', err)
      return NextResponse.json({ error: 'Failed to generate newsletter' }, { status: 500 })
    }

    const data = await response.json()
    let html = data.choices[0]?.message?.content || ''

    // Strip markdown code blocks if present
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()

    return NextResponse.json({ html })
  } catch (error) {
    console.error('Error generating newsletter:', error)
    return NextResponse.json({ error: 'Failed to generate newsletter' }, { status: 500 })
  }
}
