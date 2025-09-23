import { Type, FunctionDeclaration } from "@google/genai";
import { CONFIG } from "../config.js";

const describeTable: FunctionDeclaration = {
  name: "describe_table",
  description: `Return description, row count, and all columns for the fixed table \`${CONFIG.projectName}.${CONFIG.datasetId}.${CONFIG.tableId}\`.`,
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const sqlQuery: FunctionDeclaration = {
  name: "sql_query",
  description: `Run a SQL query using ONLY the fixed table \`${CONFIG.projectName}.${CONFIG.datasetId}.${CONFIG.tableId}\` (use backticks).`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Single-line SQL for the fixed table." }
    },
    required: ["query"]
  }
};

export const bigQueryTools = [
  { functionDeclarations: [describeTable, sqlQuery] }
];