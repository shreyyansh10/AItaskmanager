from app.prompts.task_extraction_prompt import TASK_EXTRACTION_PROMPT_TEMPLATE

class PromptService:
    """
    PromptService handles prompt construction for the AI Task Manager.

    DESIGN PHILOSOPHY (Interview/Architecture Context):
    We maintain a strict separation between Prompt Content and Orchestration Logic:
    1. Content (app/prompts/): Raw prompt templates and text-based system instructions
       are saved as pure constants in separate modules. This allows product managers,
       copywriters, or prompt engineers to modify instructions, examples, and rules
       without touching runtime code, database models, or API logic.
    2. Orchestration (app/services/): Service classes (like PromptService) handle the dynamic
       construction, parameter mapping, and schema injection. This code compiles templates
       into runtime-ready prompt strings, maintaining zero knowledge of LLM network/provider
       connections or database states.
    """

    def build_task_extraction_prompt(self, source_text: str) -> str:
        """
        Assembles the task extraction prompt by injecting the raw source text
        into the predefined prompt template.

        Args:
            source_text (str): The raw unstructured text containing task notes.

        Returns:
            str: The fully-formed prompt string ready for LLM consumption.
        """
        if not source_text:
            source_text = ""
        return TASK_EXTRACTION_PROMPT_TEMPLATE.format(source_text=source_text.strip())
