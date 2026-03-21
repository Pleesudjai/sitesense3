# AI Layer Rules
# Load this ONLY when building or editing Claude API integration

## Model
- Always use `claude-sonnet-4-6` for main reasoning and report generation
- Use `claude-haiku-4-5-20251001` for sub-agent scouts (faster, cheaper)

## Prompt Engineering Standards

### Always use structured prompts:
```python
prompt = f"""You are an expert civil engineer specializing in Arizona infrastructure.

## Task
{task_description}

## Input Data
{json.dumps(input_data, indent=2)}

## Output Format
Return a JSON object with this exact structure:
{{
  "risk_level": "low|medium|high|critical",
  "score": 0-100,
  "summary": "one sentence",
  "recommendations": ["item 1", "item 2", "item 3"],
  "confidence": "low|medium|high"
}}

Return ONLY valid JSON. No markdown, no explanation outside the JSON.
"""
```

### Prompt Rules
- Give Claude a clear expert role at the start
- Always specify the exact output format (JSON preferred for machine use)
- Include input data inline in the prompt
- Ask for confidence levels to flag uncertain analyses
- Keep system prompts under 500 tokens

## Claude API Call Pattern
```python
import anthropic
import json

client = anthropic.Anthropic()

def analyze_with_claude(prompt: str, model: str = "claude-sonnet-4-6") -> dict:
    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return json.loads(message.content[0].text)
```

## Sub-Agent Pattern (for research)
```python
# Use Haiku for fast, cheap research sub-agents
research_prompt = f"""Search your knowledge for: {research_question}
Return 3-5 bullet points only. Be concise. No preamble."""

result = analyze_with_claude(research_prompt, model="claude-haiku-4-5-20251001")
```

## Cost Management
- Log every API call: model, input tokens, output tokens, purpose
- For demo: cache repeated calls with same input
- Avoid calling Claude in loops — batch inputs when possible
