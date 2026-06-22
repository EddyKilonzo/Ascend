from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict


@dataclass
class _Bucket:
    count: int = 0
    errors: int = 0
    total_ms: float = 0.0
    cache_hits: int = 0


_buckets: Dict[str, _Bucket] = defaultdict(_Bucket)


def record(module: str, latency_ms: float, error: bool = False, cached: bool = False) -> None:
    b = _buckets[module]
    b.count += 1
    b.total_ms += latency_ms
    if error:
        b.errors += 1
    if cached:
        b.cache_hits += 1


def snapshot() -> dict:
    out = {}
    for module, b in _buckets.items():
        out[module] = {
            "requests": b.count,
            "errors": b.errors,
            "cache_hits": b.cache_hits,
            "avg_latency_ms": round(b.total_ms / b.count, 2) if b.count else 0.0,
            "error_rate": round(b.errors / b.count, 4) if b.count else 0.0,
        }
    return out


class Timer:
    def __init__(self) -> None:
        self._start: float = 0.0

    def __enter__(self) -> "Timer":
        self._start = time.perf_counter()
        return self

    def __exit__(self, *_: object) -> None:
        pass

    @property
    def elapsed_ms(self) -> float:
        return (time.perf_counter() - self._start) * 1000
