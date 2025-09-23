import { BigQuery } from "@google-cloud/bigquery";

import { CONFIG } from "../config.js";

const bq = new BigQuery({
  projectId: CONFIG.projectName || undefined,
  location: CONFIG.datasetLocation, 
});

// Return table description, row count, and columns (name/type/mode/description)
export async function describeTable() {
  const dataset = bq.dataset(CONFIG.datasetId, )
  const table = dataset.table(CONFIG.tableId);
  const [meta] = await table.getMetadata();

  const columns = (meta.schema?.fields ?? []).map((f: any) => ({
    name: f.name,
    type: f.type,
    mode: f.mode,
    description: f.description ?? "",
  }));

  return {
    table: CONFIG.tableId,
    description: meta.description ?? "",
    rowCount: meta.numRows ? Number(meta.numRows) : undefined,
    columns,
  };
}

// Run SQL query
export async function runSql(query: string) {
  const cleaned = query.replace(/\\n/g, " ").replace(/\n/g, " ").trim();

  const [job] = await bq.createQueryJob({
    query: cleaned,
    useLegacySql: false,
    location: CONFIG.datasetLocation,
  });

  const [rows] = await job.getQueryResults();
  return rows.map((r: any) => ({ ...r }));
}
