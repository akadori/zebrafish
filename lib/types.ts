export type Plugin = {
	onInit?: () => void;
	beforeRestart?: () => void;
	onRestarted?: () => void;
};
