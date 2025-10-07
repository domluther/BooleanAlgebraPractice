import { createFileRoute } from "@tanstack/react-router";
import { TruthTable } from "@/components";
import { SharedLayout } from "@/components/SharedLayout";

export const Route = createFileRoute("/truthtable")({
component: TruthTablePage,
});

function TruthTablePage() {
	return (
<SharedLayout>
			{(recordScoreAndUpdate) => (
<TruthTable onScoreUpdate={recordScoreAndUpdate} />
			)}
		</SharedLayout>
	);
}
