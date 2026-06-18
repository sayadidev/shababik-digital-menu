import { getAnalyticsSummary } from "@/lib/actions/analytics";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

export default async function AdminPage() {
  const initialSummary = await getAnalyticsSummary();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <AnalyticsDashboard initialSummary={initialSummary} />
    </div>
  );
}
