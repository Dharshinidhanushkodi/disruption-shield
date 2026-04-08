"""
DisruptionShield - LLM Client
Thin wrapper around Groq (primary) and OpenAI (fallback) for LLM calls.
All agents use this shared client.
"""

import asyncio
from typing import Optional
import google.generativeai as genai
from config import get_llm_config


async def call_llm(
    prompt: str,
    system_prompt: str = "You are DisruptionShield Coordinator, an expert AI productivity assistant.",
    max_tokens: int = 1024,
    temperature: float = 0.4,
) -> str:
    """
    Call the configured LLM (Gemini) with a prompt.
    Returns the response text.
    """
    config = get_llm_config()
    provider = config["provider"]

    if provider == "gemini":
        return await _call_gemini(
            prompt=prompt,
            system_prompt=system_prompt,
            model=config["model"],
            api_key=config["api_key"],
            max_tokens=max_tokens,
            temperature=temperature,
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")


async def _call_gemini(
    prompt: str,
    system_prompt: str,
    model: str,
    api_key: str,
    max_tokens: int,
    temperature: float,
) -> str:
    """Call Google Gemini API asynchronously via the official SDK."""
    genai.configure(api_key=api_key)
    
    # Create the model instance
    # Note: In the official SDK, system_instruction is passed during model initialization
    gemini_model = genai.GenerativeModel(
        model_name=model,
        system_instruction=system_prompt
    )
    
    # Since we need async, but the standard SDK is synchronous for generate_content,
    # we wrap it in a thread if necessary, or use the async version if available.
    # The modern SDK has an async version: generate_content_async.
    
    generation_config = genai.types.GenerationConfig(
        max_output_tokens=max_tokens,
        temperature=temperature,
    )
    
    response = await gemini_model.generate_content_async(
        prompt,
        generation_config=generation_config
    )
    
    return response.text.strip()
