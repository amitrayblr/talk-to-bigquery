#!/usr/bin/env node
import { Command } from "commander";
import { createResponse } from "./services/genAI.js";

const program = new Command();

program
  .name("sqltalk")
  .description("Ask one question; print the answer and per-call usage.")
  .argument("<question...>", "Your question about the table")
  .action(async (questionParts: string[]) => {
    const prompt = questionParts.join(" ").trim();
    if (!prompt) {
      program.outputHelp();
      process.exit(1);
    }

    try {
      const { text, metadata } = await createResponse(prompt);

      // Final response
      console.log(text);

      // Per-call response metadata (function calls & tokens)
      if (metadata?.length) {
        console.log("\nCalls:");
        for (const m of metadata) {
          const names = m.functionCalls?.length ? m.functionCalls.join(", ") : "none";
          const u = m.usage ?? {};
          console.log(
            `${m.index}) functions: ${names} - tokens: prompt=${u.promptTokenCount ?? 0}, tool=${u.toolUsePromptTokenCount ?? 0}, output=${u.candidatesTokenCount ?? 0}, cache=${u.cachedContentTokenCount ?? 0}, thinking=${u.thoughtsTokenCount ?? 0}, total=${u.totalTokenCount ?? 0}`
          );
        }
      }
    } catch (e: any) {
      console.error("Error:", e?.message ?? e);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
