import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/ops/resource-page";
import * as M from "@/lib/modules";
import { useRows } from "@/lib/ops";

export const Route = createFileRoute("/_authenticated/influencers/targets")({
  head: () => ({
    meta: [
      { title: "Target Tracking — Marketing Operations" },
      { name: "description", content: "Monthly post and reach targets versus achieved results." },
      { property: "og:title", content: "Target Tracking — Marketing Operations" },
      { property: "og:description", content: "Monthly post and reach targets versus achieved results." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: influencers = [] } = useRows("influencers", { order: { column: "name", ascending: true } });
  const options = influencers.map((i) => ({ value: String(i["id"]), label: String(i["name"]) }));
  return (
    <ResourcePage
      title="Target Tracking"
      description="Monthly targets versus achieved posts and reach."
      table="influencer_targets"
      addLabel="Add target"
      order={{ column: "period", ascending: false }}
      columns={M.targetColumns(M.nameMap(influencers))}
      fields={M.targetFields(options)}
    />
  );
}
