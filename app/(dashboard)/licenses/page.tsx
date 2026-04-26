// import { getLicenses } from "@/data"

import Link from "next/link"
import { Plus } from "lucide-react"

import { DataTable } from "./_components/data-table"
import { columns, License } from "./column"
import config from "@/lib/config/config"

//fetch license data from api
async function getLicenses(): Promise<License[]> {
  const res = await fetch(`${config.env.apiEndpoint}/api/licenses`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-cache'
  })
  const data = await res.json()
  return data;
}

export default async function LicensesPage() {
  const data = await getLicenses()

  return (
    <div className="">
      <div className='flex items-center justify-between my-5 group'>
        <h1 className="font-semibold text-xl text-gray-800 dark:text-gray-200">Licenses</h1>
        <Link href={'/licenses/create'} className='flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-800'>
          <span>Create New License</span>
          <Plus className='mr-2' />
        </Link>
      </div>
      <div className="space-y-4">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  )
}
