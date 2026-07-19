import os
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import ast
from langchain_core.output_parsers import JsonOutputParser
import asyncio
load_dotenv()
llm = ChatMistralAI(model="mistral-small-latest", temperature=0)

prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a speech coach evaluating a 1-minute impromptu speech on the topic.
     You will be provided a transcript as well .

Evaluate on: topic relevance, opening, structure, clarity, content density, fluency, and conclusion.

Respond ONLY with a JSON object. All string values MUST be in double quotes.

Format:
{{"score": <number 1-10>, "summary": "<one sentence>", "feedback": "<3-4 sentences>", "content_sufficiency": "<one sentence>"}}"""),
    ("user", "Here is the topic {topic} and the transcript : {transcript}")
])
chain = prompt | llm | JsonOutputParser()

async def generate_response(topic: str, transcript: str) -> dict:
    result = await chain.ainvoke({
        "topic": topic,
        "transcript": transcript if transcript else "Transcript Not provided"
    })
    return result


