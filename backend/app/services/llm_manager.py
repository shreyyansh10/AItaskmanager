import logging
from typing import List
from app.providers.base_provider import LLMProvider, ProviderError

logger = logging.getLogger(__name__)

class AllProvidersFailedError(Exception):
    """Raised when all configured LLM providers fail to generate a response."""
    pass

class LLMManager:
    """
    LLMManager orchestrates fallback routing across a list of LLM providers.
    Attempts generation with each provider in sequence.
    If a provider raises a ProviderError, logs a warning and tries the next.
    If all configured providers fail, raises AllProvidersFailedError.
    """

    def __init__(self, providers: List[LLMProvider]):
        """
        Initialize LLMManager with a list of LLM providers.
        
        Args:
            providers (List[LLMProvider]): Ordered list of LLM provider instances.
        """
        self.providers = providers

    async def generate(self, prompt: str) -> str:
        """
        Generate a text response from the prompt by trying each provider in order.
        
        Args:
            prompt (str): The compiled prompt string.
            
        Returns:
            str: The raw text response from the first succeeding provider.
            
        Raises:
            AllProvidersFailedError: If all providers fail.
        """
        if not self.providers:
            raise AllProvidersFailedError("No LLM providers configured in LLMManager.")

        failures = []
        for provider in self.providers:
            provider_name = provider.__class__.__name__
            try:
                logger.info(f"Attempting generation with LLM provider: {provider_name}")
                response = await provider.generate(prompt)
                logger.info(f"LLM generation succeeded with provider: {provider_name}")
                return response
            except ProviderError as e:
                logger.warning(f"Provider {provider_name} failed: {str(e)}. Initiating fallback...")
                failures.append(f"{provider_name} ({str(e)})")
        
        # All providers failed
        error_msg = f"All LLM providers failed to generate a response: {', '.join(failures)}"
        logger.error(error_msg)
        raise AllProvidersFailedError(error_msg)
