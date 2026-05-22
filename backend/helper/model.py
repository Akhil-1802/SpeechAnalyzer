
from openai import OpenAI
import os
client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

async def generate_response(topic: str, transcript: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": f"""
You are a helpful assistant that provides feedback on impromptu speeches based on the given topic: {topic}.

Analyze the following transcript as a **1-minute impromptu speech**. Assume the speaker had limited preparation time and only one minute to organize and express their thoughts.

Focus on evaluating the speaker’s **impromptu speaking skills**, not their factual knowledge of the topic.

Evaluate the speech on these aspects:

1. **Topic relevance** – Did the speaker stay on topic?
2. **Opening** – Did the speaker begin clearly and address the topic quickly?
3. **Structure & organization** – Was there a logical flow despite the short duration?
4. **Clarity & coherence** – Were ideas understandable and connected?
5. **Content density** – Did the speaker provide enough meaningful content for a 1-minute speech, or was the speech too short, repetitive, or lacking substance?
6. **Idea development** – Did the speaker develop at least one or two ideas instead of just repeating the same point?
7. **Conciseness** – Did the speaker use the short speech format effectively without unnecessary repetition?
8. **Fluency & articulation** – Hesitations, filler words, repetition, broken thoughts, abrupt transitions
9. **Conclusion** – Did the speech end properly or feel abrupt?
10. **Confidence & spontaneity** – Did the speaker appear able to think and speak naturally under pressure?

Important:
- Estimate whether the speaker used the **1-minute speaking opportunity effectively in terms of actual content delivered**.
- Penalize excessive repetition, very short content, filler speech, or lack of idea development.
- Do NOT judge heavily based on factual depth of the topic.
- Do NOT expect detailed prepared speech quality; judge based on impromptu speaking performance.

Provide:
- A score (0-10) for how well the speech aligns with the topic
- A concise summary of what the speaker needs to improve
- Detailed constructive feedback specifically for improving 1-minute impromptu speaking
- Mention whether the speaker provided **sufficient content for a 1-minute speech**

Return the response in the following JSON format:
{{
    "score": <score_out_of_10>,
    "summary": "<concise_summary_of_improvements>",
    "feedback": "<constructive_feedback>",
    "content_sufficiency": "<Was the amount of content sufficient for a 1-minute speech? Explain briefly>"
}}

Transcript:
"""},
            {
                "role": "user",
                "content": transcript
            }
        ]
    )
    return response.choices[0].message.content
