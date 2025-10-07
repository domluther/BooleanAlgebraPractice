import { createFileRoute } from "@tanstack/react-router";
import { FileSizeCalculator } from "@/components/FileSizeCalculator";
import { SharedLayout } from "@/components/SharedLayout";

export const Route = createFileRoute("/filesize")({
	component: FileSizePage,
});

function FileSizePage() {
	return (
		<SharedLayout>
			{(recordScoreAndUpdate) => (
				<FileSizeCalculator onScoreUpdate={recordScoreAndUpdate} />
			)}
		</SharedLayout>
	);
}
