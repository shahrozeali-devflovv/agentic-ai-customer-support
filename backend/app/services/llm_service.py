import os

from groq import Groq


LLM_MODEL = "qwen/qwen3.6-27b"


def get_groq_client() -> Groq:
    api_key = os.getenv(
        "GROQ_API_KEY"
    )

    if not api_key:
        raise ValueError(
            "GROQ_API_KEY is not configured"
        )

    return Groq(
        api_key=api_key,
    )


def generate_response(
    prompt: str,
) -> str:
    cleaned_prompt = prompt.strip()

    if not cleaned_prompt:
        raise ValueError(
            "Prompt cannot be empty"
        )

    client = get_groq_client()

    completion = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {
                "role": "user",
                "content": cleaned_prompt,
            }
        ],
        temperature=0.7,
        max_completion_tokens=300,
        reasoning_effort="none",
        reasoning_format="hidden",
    )

    content = (
        completion.choices[0]
        .message.content
    )

    if not content:
        raise ValueError(
            "Groq returned an empty response"
        )

    return content.strip()