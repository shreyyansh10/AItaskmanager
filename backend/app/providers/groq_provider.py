import httpx
import time
import logging
from app.providers.base_provider import LLMProvider, ProviderError

logger = logging.getLogger(__name__)

class GroqProvider(LLMProvider):
    """
    LLMProvider implementation for Groq.
    Uses direct HTTP requests via httpx to avoid external SDK dependencies.
    """

    def __init__(self, api_key: str, model_name: str = "llama-3.3-70b-versatile", timeout: float = 30.0):
        if not api_key:
            raise ValueError("Groq API key must be provided.")
        self.api_key = api_key
        self.model_name = model_name
        self.timeout = timeout
        self.url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0,
        }

        start_time = time.perf_counter()
        logger.info(f"Initiating Groq request [model={self.model_name}]")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(self.url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                
                # Extract content
                text = data["choices"][0]["message"]["content"]
                
                duration = time.perf_counter() - start_time
                logger.info(f"Groq request completed successfully in {duration:.3f}s [model={self.model_name}]")
                return text

        except httpx.TimeoutException as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Groq request timed out after {duration:.3f}s: {str(e)}")
            raise ProviderError(f"Groq request timed out: {str(e)}") from e

        except httpx.HTTPStatusError as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Groq request failed with status {e.response.status_code} in {duration:.3f}s: {e.response.text}")
            raise ProviderError(f"Groq request failed with status {e.response.status_code}: {e.response.text}") from e

        except (KeyError, TypeError) as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Groq returned malformed response in {duration:.3f}s: {str(e)}")
            raise ProviderError(f"Groq returned a malformed response: {str(e)}") from e

        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Groq request failed with unexpected error in {duration:.3f}s: {str(e)}")
            raise ProviderError(f"Groq internal provider error: {str(e)}") from e
