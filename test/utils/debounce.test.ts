import { debounce } from '../../lib/utils/debounce';
import { describe, test, vi, expect } from "vitest";

describe("debounce", () => {
    test("debounce", () => {
        const callback = vi.fn();
        const debouncedCallback = debounce(callback, 100);
        debouncedCallback();
        debouncedCallback();
        debouncedCallback();
        expect(callback).not.toBeCalled();
        setTimeout(() => {
            expect(callback).toHaveBeenCalledTimes(1);
        }, 100);
    }
    );
});
