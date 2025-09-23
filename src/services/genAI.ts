import { GoogleGenAI, FunctionCallingConfigMode, Content } from "@google/genai";

import { bigQueryTools } from "../tools/bigqueryTools.js";
import { describeTable, runSql} from "./bigqueryService.js";

import { CONFIG } from "../config.js";

// Creating GenAI Client
const ai = new GoogleGenAI({
  vertexai: true,
  project: CONFIG.projectName,
  location: CONFIG.location,
});

// Defining types
type ResponseResult = {
  text: string;
  metadata: {
    index: number;
    functionCalls: string[];
    usage: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
      toolUsePromptTokenCount?: number;
      cachedContentTokenCount?: number;
      thoughtsTokenCount?: number;
    };
  }[];
};

const SYSTEM_INSTRUCTIONS = [
  `You MUST use the fixed BigQuery table: \`${CONFIG.projectName}.${CONFIG.datasetId}.${CONFIG.tableId}\`.`,
  `Never ask the user for dataset or table names.`,
  `If you need schema, call describe_table first, then call sql_query once.`,
  `Do not reference any other tables or datasets.`
].join(" ");

const aiConfig = {
  systemInstruction: SYSTEM_INSTRUCTIONS,
  temperature: 0.2,
  tools: bigQueryTools,
  toolConfig: {
    functionCallingConfig: {
      mode: FunctionCallingConfigMode.AUTO,
    },
  },
}

export async function createResponse(input: string): Promise<ResponseResult> {
  console.log("Received message:", input)

  const contents: Content[] = [
    { role: "user", parts: [{ text: input }] },
  ];

  let response =  await ai.models.generateContent({
    model: CONFIG.modelId,
    contents: contents,
    config: aiConfig
  });

  const metadata: ResponseResult["metadata"] = [];
  let callIndex = 1;

  // record first call metadata
  metadata.push({
    index: callIndex++,
    functionCalls: (response.functionCalls ?? []).map((c: any) => c.name),
    usage: {
      promptTokenCount: response?.usageMetadata?.promptTokenCount,
      candidatesTokenCount: response?.usageMetadata?.candidatesTokenCount,
      totalTokenCount: response?.usageMetadata?.totalTokenCount,
      toolUsePromptTokenCount: response?.usageMetadata?.toolUsePromptTokenCount,
      cachedContentTokenCount: response?.usageMetadata?.cachedContentTokenCount,
      thoughtsTokenCount: response?.usageMetadata?.thoughtsTokenCount,
    }
  });

  let limit = 0;

  while (response.functionCalls && response.functionCalls.length > 0 && limit < 4) {
    const functionResponseParts: any[] = [];

    for (const call of response.functionCalls) {
      if (call.name) {

        let result: unknown;
        
        if (call.name === "describe_table") {
          result = await describeTable();
        } else if (call.name === "sql_query") {
          result = await runSql(String(call.args?.query ?? ""));
        } else {
          result = { error: `Unknown function: ${call.name}` };
        }

        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: { result },
          },
        });
      }
    }

    if (response.candidates?.[0]?.content) contents.push(response.candidates[0].content);
    contents.push({ role: "user", parts: functionResponseParts });
    
    response = await ai.models.generateContent({
      model: CONFIG.modelId,
      contents,
      config: aiConfig,
    });

    // record subsequent call metadata
    metadata.push({
      index: callIndex++,
      functionCalls: (response.functionCalls ?? []).map((c: any) => c.name),
      usage: {
        promptTokenCount: response?.usageMetadata?.promptTokenCount,
        candidatesTokenCount: response?.usageMetadata?.candidatesTokenCount,
        totalTokenCount: response?.usageMetadata?.totalTokenCount,
        toolUsePromptTokenCount: response?.usageMetadata?.toolUsePromptTokenCount,
        cachedContentTokenCount: response?.usageMetadata?.cachedContentTokenCount,
        thoughtsTokenCount: response?.usageMetadata?.thoughtsTokenCount,
      }
    });
    limit += 1;
  }
  return { text: response.text ?? "", metadata };
}
