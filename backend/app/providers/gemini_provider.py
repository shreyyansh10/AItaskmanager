import httpx
import time
import logging
from app.providers.base_provider import LLMProvider, ProviderError

logger = logging.getLogger(__name__)

class GeminiProvider(LLMProvider):
    """
    LLMProvider implementation for Google Gemini.
    Uses direct HTTP requests to generative language endpoints.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash", timeout: float = 30.0):
        if not api_key:
            raise ValueError("Gemini API key must be provided.")
        self.api_key = api_key
        self.model_name = model_name
        self.timeout = timeout

    async def generate(self, prompt: str) -> str:
        # Construct Gemini generateContent URL
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        
        headers = {
            "Content-Type": "application/json",
        }
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.0
            }
        }

        start_time = time.perf_counter()
        logger.info(f"Initiating Gemini request [model={self.model_name}]")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                
                # Extract text from standard Gemini REST API payload
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                
                duration = time.perf_counter() - start_time
                logger.info(f"Gemini request completed successfully in {duration:.3f}s [model={self.model_name}]")
                return text

        except httpx.TimeoutException as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Gemini request timed out after {duration:.3f}s: {str(e)}")
            raise ProviderError(f"Gemini request timed out: {str(e)}") from e

        except httpx.HTTPStatusError as e:
            duration = time.perf_counter() - start_time
            # Redact API key from logged URL if visible
            logger.warning(f"Gemini request failed with status {e.response.status_code} in {duration:.3f}s: {e.response.text}")
            raise ProviderError(f"Gemini request failed with status {e.response.status_code}: {e.response.text}") from e

        except (KeyError, IndexError, TypeError) as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Gemini returned malformed response in {duration:.3f}s: {str(e)}")
            raise ProviderError(f"Gemini returned a malformed response: {str(e)}") from e

        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.warning(f"Gemini request failed with unexpected error in {duration:.3f}s: {str(e)}")
            raise ProviderError(f"Gemini internal provider error: {str(e)}") from e
