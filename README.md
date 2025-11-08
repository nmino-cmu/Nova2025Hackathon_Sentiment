# Nova2025Hackathon_Sentiment

<b> Ts so skibidi </b>

For Sentiment Analysis and Ranking: npm install ai @ai-sdk/openai dotenv-cli --legacy-peer-deps

"ai" (Vercel AI SDK)
This is the main AI toolkit. It gives us the most important function we're using: generateObject(), which is what forces Claude to return a perfect JSON object every time.

@ai-sdk/openai
This is the "provider" or "client" that connects to OpenRouter. It gives us the createOpenAI() function, which we use to create our openrouter client.

dotenv-cli
This package is only necessary because you want to keep your .env.local file outside the code folder. It lets us run dotenv -e ../.env.local next dev in your package.json
