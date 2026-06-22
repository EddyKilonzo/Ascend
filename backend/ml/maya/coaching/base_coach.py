from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import Any

from schemas.requests import UserContext
from schemas.responses import ExplanationFactor, MayaResponse
from llm.claude_client import claude
from llm.prompt_builder import MAYA_SYSTEM_PROMPT, build_coaching_message
from llm.response_parser import parse_coaching_response
from observability.logger import log_info


class BaseCoach(ABC):
    module_name: str = "base"

    @abstractmethod
    def analyze(self, context: UserContext) -> dict[str, Any]:
        """Return a structured analysis dict — no LLM calls here."""

    def _build_factors(self, analysis: dict[str, Any]) -> list[ExplanationFactor]:
        raw_factors = analysis.get("factors", [])
        result: list[ExplanationFactor] = []
        for f in raw_factors:
            if isinstance(f, dict):
                result.append(
                    ExplanationFactor(
                        name=f.get("name", ""),
                        impact=str(f.get("impact", "0")),
                        direction=f.get("direction", "neutral"),
                        description=f.get("description", ""),
                    )
                )
            else:
                result.append(
                    ExplanationFactor(name=str(f), impact="0", direction="neutral", description="")
                )
        return result

    async def coach(
        self,
        context: UserContext,
        user_message: str | None = None,
    ) -> MayaResponse:
        request_id = str(uuid.uuid4())
        analysis = self.analyze(context)

        user_msg = build_coaching_message(self.module_name, analysis, user_message)
        raw = await claude.generate(MAYA_SYSTEM_PROMPT, user_msg)
        parsed = parse_coaching_response(raw)

        log_info("coach_response_generated", module=self.module_name, request_id=request_id)

        return MayaResponse(
            request_id=request_id,
            user_id=context.user_id,
            coaching_module=self.module_name,
            prediction=analysis.get("prediction"),
            confidence=analysis.get("confidence"),
            factors=self._build_factors(analysis),
            explanation=parsed["explanation"],
            recommendations=parsed["recommendations"],
            urgency=analysis.get("urgency", "low"),
        )
