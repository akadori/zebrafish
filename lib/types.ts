export type Plugin = {
	onInit?: () => void;
	beforeRestart?: () => void;
	onRestarted?: () => void;
};

declare global {
	const DEBUG_BUILD: boolean; // esbuild will define this variable
	const VERSION: string; // esbuild will define this variable
}
