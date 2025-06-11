import fs from "node:fs/promises";
import { searchClient } from "@algolia/client-search";

import { WaaSClient } from "./WaaSClient";

const ALGOLIA_APP_ID = "45BWZJ1SGC";
const ALGOLIA_API_KEY =
  "OGJjYTM0MDlhY2NlODExNDAxZGFiYjEzOWNmN2E3ZGZhZmU1ZmEyNGE5NjVkMjU3MzFiZWVjODBkZDE5ZmVkOXRhZ0ZpbHRlcnM9JTVCJTVCJTIyam9ic19hcHBsaWNhbnQlMjIlNUQlNUQmYW5hbHl0aWNzVGFncz0lNUIlMjJ3YWFzJTIyJTVEJnVzZXJUb2tlbj16JTJCQUJDN0ZMUUllNnRCcERDV214cG8zZ2NrZHJMaWQ3eE43eDNENWpsOU0lM0Q";
const INDEX_NAME = "WaaSPublicCompanyJob_created_at_desc_production";

const client = searchClient(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

const waas = new WaaSClient();
await waas.init();

const { hits } = await client.searchSingleIndex({
  indexName: INDEX_NAME,
  searchParams: {
    query: "",
    hitsPerPage: 100,
    page: 0,
    filters: [
      "role:eng",
      'locations_for_search:"San Francisco, CA, US"',
      'job_type:"intern"',
    ].join(" AND "),
    attributesToRetrieve: [
      "company_id",
      "company_name",
      "company_website",
      "title",
      "locations_for_search",
      "description",
    ],
  },
});

let OUTPUT = "";

for (const hit of hits) {
  const data = await waas
    .fetch("/companies/fetch", {
      method: "POST",
      body: JSON.stringify({ ids: [hit.company_id] }),
    })
    .then((res) => res.json());

  const founders = data.companies[0].founders;

  OUTPUT += `## ${hit.company_name} (${hit.company_website})\n`;
  OUTPUT += "\n";
  OUTPUT += `- **Title**: ${hit.title}\n`;
  OUTPUT += `- **Location**: ${hit.locations_for_search[2]}\n`;
  OUTPUT += `- **Founders**:\n`;
  for (const founder of founders) {
    OUTPUT += `    - **${founder.full_name}**: ${founder.linkedin}\n`;
  }
  OUTPUT += "\n";
  OUTPUT += "```\n";
  OUTPUT += hit.description;
  OUTPUT += "\n";
  OUTPUT += "```\n";
  OUTPUT += "\n";
  OUTPUT += "\n";
}

await fs.writeFile("OUTPUT.md", OUTPUT, "utf-8");
console.log(`Found ${hits.length} results! Open OUTPUT.md to see results\n`);
