

import LicenseTable from "@/components/license-table";
import LicensesCharts from "@/components/charts/licenses-charts";
import MetricCards from "@/components/metric-cards";


export default function Home() {

  return (
    <div className="">
      <h1 className="font-semibold text-xl text-gray-800 my-5 dark:text-gray-200">Dashboard</h1>
      <MetricCards />
      <LicenseTable />
      <LicensesCharts/>
    </div>
  );
}
