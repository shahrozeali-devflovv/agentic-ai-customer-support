from enum import Enum

from app.services.llm_service import (
    generate_response,
)


class Intent(str, Enum):
    KNOWLEDGE = "knowledge"
    ORDER = "order"
    ACCOUNT = "account"
    HUMAN_SUPPORT = "human_support"
    UNKNOWN = "unknown"


def classify_intent(
    message: str,
) -> Intent:
    cleaned_message = message.strip()

    if not cleaned_message:
        raise ValueError(
            "Message cannot be empty"
        )

    prompt = f"""
You are an intent classifier for a customer support system.

Classify the customer message into exactly one of these intents:

knowledge
- Questions about company policies, refunds, returns, shipping rules,
  product information, FAQs, or other knowledge-base information.

order
- Questions about a specific order, delivery status, order history,
  tracking, cancellation, or order details.

account
- Questions about the customer's own account, profile, email,
  personal information, password, or account settings.

human_support
- The customer explicitly asks to speak with a human,
  support agent, representative, or person.

unknown
- The message does not clearly belong to any of the categories above.

Return only one intent value.
Do not explain your answer.

Customer message:
{cleaned_message}
""".strip()

    response = generate_response(
        prompt
    ).strip().lower()

    try:
        return Intent(response)

    except ValueError:
        return Intent.UNKNOWN