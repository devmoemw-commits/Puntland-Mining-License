import config from "@/lib/config/config";
import { TSample, columns } from "./columns"
import { DataTable } from "./data-table"

//fetch license data from api
async function getLicenses(): Promise<TSample[]> {
  const res = await fetch(`${config.env.apiEndpoint}/api/samples`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-cache'
  })
  if (!res.ok) {
    throw new Error(`Failed to load samples: ${res.status}`)
  }
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON but got ${contentType || "unknown content type"}`)
  }
  const data = await res.json()
  return data;
}

export default async function Page() {
  const data = await getLicenses()

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
