import 'dotenv/config';

export const CONFIG = {
  projectName: String(process.env.GOOGLE_CLOUD_PROJECT),
  location: String(process.env.GOOGLE_CLOUD_LOCATION),
  modelId: process.env.MODEL_ID ?? "gemini-2.5-pro",
  datasetId: String(process.env.BIGQUERY_DATASET_ID),
  tableId: String(process.env.BIGQUERY_TABLE_ID),
  datasetLocation: String(process.env.BIGQUERY_DATASET_LOCATION)
} as const;
