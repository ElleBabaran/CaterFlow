from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

@dataclass
class SharedMemory:
    source_input: str
    state: dict[str, Any] = field(default_factory=dict)
    handoffs: list[dict[str, Any]] = field(default_factory=list)
    assumptions: list[str] = field(default_factory=list)

    def write(self, agent: str, key: str, value: Any) -> None:
        self.state[key] = value
        self.handoffs.append(
            {
                "agent": agent,
                "key": key,
                "keys_now_available": sorted(self.state.keys()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

    def read_context(self) -> dict[str, Any]:
        return {
            "source_input": self.source_input,
            "state": self.state,
            "assumptions": self.assumptions,
            "handoffs": self.handoffs,
        }

    def readiness_basis(self) -> str:
        return (
            "Customer constraints, RAG evidence, dietary controls, nutrition, "
            "procurement, suppliers, weather, logistics, and pricing were fused "
            "into one shared memory ledger."
        )
