import dotenv from 'dotenv';
dotenv.config();

async function testAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("Testing OpenAI direct connection with key:", apiKey?.slice(0, 15) + "...");
  
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um garçom virtual.' },
          { role: 'user', content: 'Olá! O que você tem hoje?' }
        ],
        max_tokens: 100
      })
    });

    const data = await res.json();
    console.log("OpenAI API response status:", res.status);
    console.log("Reply:", data.choices?.[0]?.message?.content || data);
  } catch (err) {
    console.error("Error testing OpenAI:", err);
  }
}

testAI();
