export const debounce = <T extends (...args: unknown[]) => unknown>(
	callback: T,
	delay = 250,
) => {
	let timeoutId: NodeJS.Timeout; // Node.jsの場合はNodeJS.Timeout型にする
	return (...args: unknown[]) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => callback(...args), delay);
	};
};