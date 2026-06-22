from __future__ import annotations

import asyncio
import time
from typing import Optional

import anthropic

from config import settings
from observability.logger import log_error, log_llm_call


_RETRY_DELAYS = (1.0, 2.0, 4.0)


class ClaudeClient:
    """Async Anthropic client with retry, timeout, and structured error handling."""

    def __init__(self) -> None:
        self._client: Optional[anthropic.AsyncAnthropic] = None

    def _ensure_client(self) -> anthropic.AsyncAnthropic:
        if self._client is None:
            self._client = anthropic.AsyncAnthropic(
                api_key=settings.ANTHROPIC_API_KEY,
            )
        return self._client

    async def generate(self, system_prompt: str, user_message: str) -> str:
        """Generate a completion. Returns the text of the first text block."""
        client = self._ensure_client()
        t0 = time.perf_counter()
        last_error: Optional[Exception] = None

        for attempt, delay in enumerate((*_RETRY_DELAYS, None), start=1):
            try:
                response = await asyncio.wait_for(
                    client.messages.create(
                        model=settings.PRIMARY_MODEL,
                        max_tokens=settings.MAX_TOKENS,
                        thinking={"type": "adaptive"},
                        system=system_prompt,
                        messages=[{"role": "user", "content": user_message}],
                    ),
                    timeout=settings.LLM_TIMEOUT_SECONDS,
                )
                latency_ms = (time.perf_counter() - t0) * 1000
                log_llm_call(
                    model=settings.PRIMARY_MODEL,
                    input_chars=len(system_prompt) + len(user_message),
                    latency_ms=latency_ms,
                    success=True,
                )
                # Extract first text block (skip thinking blocks)
                for block in response.content:
                    if block.type == "text":
                        return block.text
                return ""

            except anthropic.RateLimitError as exc:
                last_error = exc
                log_error("llm_rate_limit", attempt=attempt)
                if delay is None:
                    break
                await asyncio.sleep(delay)

            except anthropic.APIStatusError as exc:
                log_error("llm_api_error", status_code=exc.status_code, attempt=attempt)
                raise

            except anthropic.APIConnectionError as exc:
                last_error = exc
                log_error("llm_connection_error", attempt=attempt)
                if delay is None:
                    break
                await asyncio.sleep(delay)

            except asyncio.TimeoutError:
                log_error("llm_timeout", timeout_s=settings.LLM_TIMEOUT_SECONDS, attempt=attempt)
                raise

        log_error("llm_all_retries_exhausted", attempts=len(_RETRY_DELAYS) + 1)
        raise last_error or RuntimeError("LLM call failed after all retries")

    async def close(self) -> None:
        if self._client:
            await self._client.close()
            self._client = None


claude = ClaudeClient()
