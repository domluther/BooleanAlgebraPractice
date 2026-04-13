import { createFileRoute } from "@tanstack/react-router";
import { KMap } from "@/components/KMap";
import { SharedLayout } from "@/components/SharedLayout";

export const Route = createFileRoute("/kmap")({
	component: KMapPage,
});

function KMapPage() {
	return (
		<SharedLayout>
			{(recordScoreAndUpdate) => <KMap onScoreUpdate={recordScoreAndUpdate} />}
		</SharedLayout>
	);
}
