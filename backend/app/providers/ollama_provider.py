import httpx
import time
import logging
from app.providers.base_provider import LLMProvider, ProviderError

logger = logging.getLogger(__name__)

class OllamaProvider(LLMProvider):
    """
    LLMProvider implementation for local Ollama instances.
    Uses direct HTTP requests to Ollama generation API.
    """

    def __init__(self, base_url: str = "http://localhost:11434", model_name: str = "llama3", timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name
        self.timeout = timeout
        self.url = f"{self.base_url}/api/generate"

    async def generate(self, prompt: str) -> str:
        headers = {
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.0
            }
        }

        start_time = time.perf_counter()
        logger.info(f"Initiating Ollama request [model={self.model_name}]")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(self.url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                
                # Extract text from Ollama response
                text = data["response"]
                
                duration = time.perf_counter() - start_time
                logger.info(f"Ollama request completed successfully in {duration:.3f}s [model={self.model_name}]")
                return text

        except httpx.TimeoutException as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Ollama request timed out after {duration:.3f}s: {str(e)}")
            raise ProviderError(f"Ollama request timed out: {str(e)}") from e

        except httpx.HTTPStatusError as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Ollama request failed with status {e.response.status_code} in {duration:.3f}s: {e.response.text}")
            raise ProviderError(f"Ollama request failed with status {e.response.status_code}: {e.response.text}") from e

        except (KeyError, TypeError) as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Ollama returned malformed response in {duration:.3f}s: {str(e)}")
            raise ProviderError(f"Ollama returned a malformed response: {str(e)}") from e

        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Ollama request failed with unexpected error in {duration:.3f}s: {str(e)}")
            raise ProviderError(f"Ollama internal provider error: {str(e)}") from e
