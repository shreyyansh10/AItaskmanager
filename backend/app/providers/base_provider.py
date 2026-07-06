from abc import ABC, abstractmethod

class ProviderError(Exception):
    """Exception raised when an LLM provider call fails (e.g. timeout, HTTP error, malformed response)."""
    pass

class LLMProvider(ABC):
    """Abstract Base Class defining the contract for all LLM providers."""

    @abstractmethod
    async def generate(self, prompt: str) -> str:
        """
        Send a prompt to the LLM and return the raw text response.
        
        Args:
            prompt (str): The structured prompt.

        Returns:
            str: The raw model text output.

        Raises:
            ProviderError: If the provider call fails.
        """
        pass
