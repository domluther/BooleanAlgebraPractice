import { createFileRoute } from "@tanstack/react-router";
import { SharedLayout } from "@/components/SharedLayout";
import { UnitConverter } from "@/components/UnitConverter";

export const Route = createFileRoute("/unitconverter")({
	component: UnitConverterPage,
});

function UnitConverterPage() {
	return (
		<SharedLayout>
			{(recordScoreAndUpdate) => (
				<UnitConverter onScoreUpdate={recordScoreAndUpdate} />
			)}
		</SharedLayout>
	);
}
