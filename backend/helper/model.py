import os
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
import asyncio
import ast
load_dotenv()
llm = ChatMistralAI(model = "mistral-small-latest", temperature=0)

prompt = ChatPromptTemplate.from_messages([
    ("system","""You are a speech coach evaluating a 1-minute impromptu speech on the topic.
     You will be provided a transcript as well .

Evaluate on: topic relevance, opening, structure, clarity, content density, fluency, and conclusion.

Respond ONLY with a JSON object. All string values MUST be in double quotes.

Format:
{{"score": <number 1-10>, "summary": "<one sentence>", "feedback": "<3-4 sentences>", "content_sufficiency": "<one sentence>"}}"""
            ),
            ("user","Here is the topic {topic} and the transcript : {transcript}")
])
chain = prompt | llm 

async def generate_response(topic: str, transcript: str) -> str:
    
    result = chain.invoke({
        "topic" : topic,
        "transcript":transcript if transcript else "Transcript Not provided"
    })
    if len(result.content) == 0 :
        raise ValueError("Data is not sufficient")
    final_result = ast.literal_eval(result.content)
    return final_result


# result = asyncio.run(generate_response("Power of positive thinking", "Positive thinking is a transformative mental attitude that empowers you to face challenges with resilience, reduce stress, and unlock new opportunities. It isn't about ignoring problems or pretending life is perfect; it’s about proactively choosing to focus on solutions and learning from setbacks to achieve your goals."))
# 
# print(type(final_result))
# print(final_result['score'])

