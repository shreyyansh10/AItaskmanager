import json
import re
import logging

logger = logging.getLogger(__name__)

class JSONParsingError(Exception):
    """Exception raised when JSON cleaning or parsing fails."""
    pass

def clean_and_parse_json(text: str) -> dict:
    """
    Cleans common LLM markdown fences (e.g., ```json ... ```) 
    and parses the remaining string into a dictionary.
    
    Args:
        text (str): The raw string response from the LLM.
        
    Returns:
        dict: The parsed JSON dictionary.
        
    Raises:
        JSONParsingError: If cleanup or JSON decoding fails.
    """
    if not text:
        raise JSONParsingError("Received empty text input for JSON parsing.")

    cleaned = text.strip()
    
    # Remove markdown code fences if present
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON. Error: {str(e)}. Raw text was:\n{text}")
        raise JSONParsingError(f"Failed to decode JSON response: {str(e)}") from e
