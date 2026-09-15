from enum import Enum

from app.services.llm_service import generate_response


class Intent(str, Enum):
    CONVERSATIONAL = "conversational"
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
You are an intent classifier for an AI customer support system.

Classify the customer message into exactly ONE intent.

conversational
- Greetings, thanks, goodbyes, acknowledgements, or simple casual
  messages that do not require company or customer data.
- Examples:
  "hi"
  "hello"
  "thanks"
  "okay"
  "goodbye"
  "who are you?"
  "what can you help me with?"

knowledge
- Questions about company policies, refunds, returns, shipping rules,
  product information, FAQs, or other knowledge-base information.

order
- Questions about orders, delivery status, order history, tracking,
  cancellation, or order details.

account
- Questions about the customer's own account, profile, email,
  personal information, password, or account settings.

human_support
- ONLY when the customer explicitly asks to speak with a human,
  support agent, representative, or real person.

unknown
- The message does not clearly belong to any category above.
- Do not classify something as human_support simply because the
  request is unclear.

Return ONLY one of these exact values:

conversational
knowledge
order
account
human_support
unknown

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