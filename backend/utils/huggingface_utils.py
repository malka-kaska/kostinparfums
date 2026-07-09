import os
import httpx
from typing import Optional
from emergentintegrations.llms.openai import OpenAIClient


class HuggingFaceClient:
    def __init__(self) -> None:
        self.api_key = os.environ.get("HUGGINGFACE_API_KEY")
        self.inference_url = os.environ.get(
            "HUGGINGFACE_INFERENCE_URL",
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.2-pro",
        )
        self._client = OpenAIClient(api_key=self.api_key or "")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def text_to_image_sync(self, *, prompt: str, negative_prompt: str = "", aspect_ratio: str = "1:1", model: Optional[str] = None) -> dict:
        """
        Preferred path: use OpenAI-compatible inference hosting FLUX via
        emergentintegrations so we keep error handling and auth pipeline stable.
        Falls back to raw HF inference API if no completion-style endpoint works.
        """
        if not self.is_configured():
            raise RuntimeError("HUGGINGFACE_API_KEY is not configured")

        hf_model = model or os.environ.get(
            "HUGGINGFACE_IMAGE_MODEL",
            "black-forest-labs/FLUX.2-pro",
        )
        width, height = self._parse_aspect_ratio(aspect_ratio)

        size_str = f"{width}x{height}"

        try:
            result = self._client.images.generate(
                model=hf_model,
                prompt=prompt,
                negative_prompt=negative_prompt or "blurry, cheap, fake logo, watermark, cropped, text",
                size=size_str,
                response_format="url",
            )
            url = getattr(result, "data", [None])[0].url if getattr(result, "data", []) else None
            if url:
                return {"image_url": url, "model": hf_model, "provider": "huggingface"}
        except Exception:
            pass

        return self._hf_inference(prompt=prompt, negative_prompt=negative_prompt, width=width, height=height, model=hf_model)

    def build_marketing_prompt(self, base_prompt: str, product_name: str, brand: str, aspect_ratio: str) -> str:
        parts = [
            "Luxury e-commerce ad creative for KOSTIN Parfums.",
            f"Subject: {product_name} by {brand}.",
            "Style: premium Bulgarian fragrance boutique, black/white/gold aesthetic, editorial perfume photography.",
            "Constraints: clean negative space for text overlay in Bulgarian, no fake brand labels, authentic product presentation.",
            f"Aspect use: {aspect_ratio}.",
            base_prompt,
        ]
        return "\n".join(parts)

    def _hf_inference(self, *, prompt: str, negative_prompt: str, width: int, height: int, model: str) -> dict:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "inputs": prompt,
            "parameters": {
                "negative_prompt": negative_prompt or "blurry, cheap, logo, watermark",
                "width": width,
                "height": height,
                "num_inference_steps": 24,
            },
        }

        with httpx.Client(timeout=120) as client:
            response = client.post(self.inference_url, headers=headers, json=payload)
            response.raise_for_status()
            ctype = response.headers.get("content-type", "")
            if ctype.startswith("image/"):
                return {
                    "bytes": response.content,
                    "content_type": ctype,
                    "model": model,
                    "provider": "huggingface",
                }
            return response.json()

    @staticmethod
    def _parse_aspect_ratio(ratio: str) -> tuple[int, int]:
        mapping = {
            "1:1": (1024, 1024),
            "4:5": (1152, 896),
            "9:16": (896, 1152),
            "16:9": (1280, 720),
        }
        return mapping.get(ratio, (1024, 1024))
