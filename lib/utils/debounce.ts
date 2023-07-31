export const debounce = <T extends (...args: any[]) => unknown>(
	callback: T,
	delay = 250,
): ((...args: Parameters<T>) => void) => {
	let timeoutId: NodeJS.Timeout; // Node.jsの場合はNodeJS.Timeout型にする
	return (...args) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => callback(...args), delay);
	};
};
