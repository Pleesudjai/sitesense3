# /plan-feature — Feature Planning Command

Use this BEFORE implementing any feature. Produces a spec file that guides a clean implementation session.

## When to Use
- Before starting a new feature or major component
- When you need to think through architecture before coding
- After receiving a vague requirement that needs clarification

## Steps

1. **Understand the request:**
   Ask clarifying questions if needed:
   - What does success look like for this feature?
   - What inputs does it take? What outputs does it produce?
   - Are there any constraints (time, data, API limits)?

2. **Spin up research sub-agents:**
   Delegate the following to parallel sub-agents — DO NOT do this research yourself:
   - **Web best practices:** "What are best practices for [feature] in 2025?"
   - **Arizona data sources:** "What public datasets are available for [topic] in Arizona?"
   - **Similar implementations:** "Are there examples of [feature] built with Claude API?"

   Each sub-agent returns a 3–5 bullet summary. Discard raw content.

3. **Synthesize into a spec:**
   Create a file at `specs/[feature-name].md` with this structure:

   ```markdown
   # Feature Spec: [Feature Name]
   Date: [today's date]
   Status: Planning

   ## What We're Building
   [1-2 sentence description]

   ## Why (User Value)
   [1-2 sentences on the problem this solves]

   ## Inputs
   - [Input 1]: [description]
   - [Input 2]: [description]

   ## Outputs
   - [Output 1]: [description]

   ## Architecture Plan
   ### Frontend
   [What UI components are needed]

   ### Backend
   [What API endpoints are needed]

   ### AI Layer
   [What Claude does — prompt strategy, expected outputs]

   ### Data Sources
   [What data is needed, where it comes from]

   ## Implementation Steps
   1. [ ] Step 1
   2. [ ] Step 2
   3. [ ] Step 3

   ## Open Questions
   - [ ] Question 1

   ## Out of Scope (for MVP)
   - Item 1
   ```

4. **Review with user:**
   Present the spec and ask: "Does this match what you want? Any changes before we start coding?"

5. **Hand off to execution:**
   Once approved, say: "Run /execute with this spec to start a fresh implementation session."
