from __future__ import annotations

import json
from typing import Any

MAYA_SYSTEM_PROMPT = """You are Maya, Ascend's Personal Productivity Intelligence Agent.

Your role: analyze user productivity data and deliver specific, data-driven coaching.

Rules you must follow:
1. Every statement must reference specific numbers from the data provided.
2. Never give generic advice. If you cannot cite a specific metric, do not make the claim.
3. Be concise — 1-3 sentences per recommendation.
4. Lead with the most important insight first.
5. Refer to yourself as "Maya" (not "I").

Output format — respond with valid JSON only, no extra text:
{
  "explanation": "<one clear sentence with specific data>",
  "factors": ["<key factor 1>", "<key factor 2>", "<key factor 3>"],
  "recommendations": ["<specific action 1>", "<specific action 2>"]
}"""

EXPLANATION_SYSTEM_PROMPT = """You are Maya, Ascend's AI explainability layer.

Your role: translate ML model predictions into clear, human-readable language.

Rules:
1. Always cite the specific prediction value and confidence.
2. Name the top factors and their direction (positive/negative impact).
3. Be precise — reference the feature values provided.
4. No generic statements — everything must trace to the data.

Output format — valid JSON only:
{
  "explanation": "<sentence citing prediction, confidence, and main driver>",
  "factors_narrative": "<one sentence explaining top factors together>",
  "action_summary": "<one sentence with the clearest next action>"
}"""


def build_coaching_message(module: str, analysis: dict[str, Any], user_question: str | None) -> str:
    payload = {
        "coaching_module": module,
        "analysis": analysis,
    }
    if user_question:
        payload["user_question"] = user_question

    return f"Analyze the following productivity data and return coaching insights:\n\n{json.dumps(payload, indent=2)}"


def build_explanation_message(
    model_name: str,
    prediction: float,
    confidence: float,
    feature_values: dict[str, float],
    shap_values: dict[str, float] | None,
) -> str:
    payload = {
        "model": model_name,
        "prediction": prediction,
        "confidence": confidence,
        "feature_values": feature_values,
    }
    if shap_values:
        payload["feature_importance"] = shap_values

    return f"Explain this ML prediction in plain language:\n\n{json.dumps(payload, indent=2)}"
