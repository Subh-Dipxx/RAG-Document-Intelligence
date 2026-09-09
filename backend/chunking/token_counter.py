from __future__ import annotations

from typing import Sequence

from transformers import AutoTokenizer

from backend.config import get_settings


class TokenCounter:
    """Count model tokens using the configured embedding tokenizer."""

    def __init__(self, model_name: str | None = None) -> None:
        settings = get_settings()

        self.model_name = (
            settings.embedding_model
            if model_name is None
            else model_name
        )

        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_name
        )

    def count(self, text: str) -> int:
        if not text:
            return 0

        encoded = self.tokenizer(
            text,
            add_special_tokens=True,
            truncation=False,
            return_attention_mask=False,
            return_token_type_ids=False,
        )

        return len(encoded["input_ids"])

    def count_many(self, texts: Sequence[str]) -> list[int]:
        if not texts:
            return []

        encoded = self.tokenizer(
            list(texts),
            add_special_tokens=True,
            truncation=False,
            padding=False,
            return_attention_mask=False,
            return_token_type_ids=False,
        )

        return [
            len(input_ids)
            for input_ids in encoded["input_ids"]
        ]


_counter: TokenCounter | None = None


def get_token_counter() -> TokenCounter:
    """Return the cached token counter for the current worker process."""
    global _counter

    if _counter is None:
        _counter = TokenCounter()

    return _counter
