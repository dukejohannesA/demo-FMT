import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

type Body = { messages?: unknown; context?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, context } = (await request.json()) as Body;
        if (!Array.isArray(messages)) {
          return new Response("Messages required", { status: 400 });
        }

        const key = process.env.VITE_GROQ_API_KEY;
        if (!key) return new Response("Missing VITE_GROQ_API_KEY", { status: 500 });

        const groq = createOpenAICompatible({
          name: "groq",
          baseURL: "https://api.groq.com/openai/v1",
          headers: {
            "Authorization": `Bearer ${key}`,
          },
        });

        const model = groq("llama-3.3-70b-versatile");

        const system = `You are an expert infrastructure finance advisor specializing in Sub-Saharan African energy access projects. You are embedded inside Alfred's City Urban Electrification Financial Model — a live 10-year model (2025–2034) for a Namibian Regional Electricity Distributor (RED) targeting urban household electrification.

Your role is to help government officials, development finance institutions (DFIs), RED managers, and NamPower stakeholders understand, interpret, and act on the model's outputs.

CURRENT LIVE MODEL STATE (updated as of this message — always treat these as the latest values):
${context ?? "(no context injected yet)"}

YOUR BEHAVIOUR RULES:
- Always refer to the live numbers above as the current state of the model — these are freshly injected on every message
- Never rely on numbers mentioned in earlier conversation turns — the CURRENT LIVE MODEL STATE above always supersedes anything discussed before
- Explain what the numbers mean in plain language — avoid jargon unless the user is clearly technical
- When verdicts show WARN, explain why and what levers could improve the outcome
- Connect financial metrics to real-world implications (e.g. "A DSCR below 1.2 means the project cannot service its debt from operating cash flow alone")
- Reference Namibian context where relevant: ECB tariff regulation, NamPower bulk supply, GRN budget constraints, AfDB/KfW/World Bank financing instruments, RBF mechanisms
- When asked about trade-offs, explain the tension clearly
- You may suggest which assumptions to adjust to improve viability, but make clear these are suggestions not recalculations
- Keep responses focused and structured — use bullet points or short paragraphs
- If the user says they changed an input, confirm the new value from the CURRENT LIVE MODEL STATE above`;

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});