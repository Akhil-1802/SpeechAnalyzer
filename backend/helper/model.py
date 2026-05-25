from openai import AsyncOpenAI
import os

client = AsyncOpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

async def generate_response(topic: str, transcript: str) -> str:
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": f"""You are a speech coach evaluating a 1-minute impromptu speech on the topic: {topic}.

Evaluate on: topic relevance, opening, structure, clarity, content density, fluency, and conclusion.

Respond ONLY with a JSON object. All string values MUST be in double quotes.

Format:
{{"score": <number 1-10>, "summary": "<one sentence>", "feedback": "<3-4 sentences>", "content_sufficiency": "<one sentence>"}}"""
            },
            {
                "role": "user",
                "content": transcript if transcript else "No transcript provided."
            }
        ]
    )
    return response.choices[0].message.content
