import fs from "node:fs/promises";
import { searchClient } from "@algolia/client-search";

const ALGOLIA_APP_ID = "45BWZJ1SGC";
const ALGOLIA_API_KEY = "REMOVED FOR SECURITY, SEE BLOG POST";
const INDEX_NAME = "WaaSPublicCompanyJob_created_at_desc_production";

const client = searchClient(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

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
  OUTPUT += `## ${hit.company_name} (${hit.company_website})\n`;
  OUTPUT += "\n";
  OUTPUT += `- **Title**: ${hit.title}\n`;
  OUTPUT += `- **Location**: ${hit.locations_for_search[2]}\n`;
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
