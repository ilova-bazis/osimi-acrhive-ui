import { describe, expect, it } from 'vitest';
import { createSetupItemIndexAllocator } from './setupItemIndexAllocator';

describe('setup item index allocator', () => {
	it('allocates after persisted standalone item indexes', () => {
		const allocator = createSetupItemIndexAllocator([1]);

		expect(allocator.reserve()).toBe(2);
	});

	it('allocates after the greatest sparse or reordered persisted index', () => {
		const allocator = createSetupItemIndexAllocator([9, 2, 5]);

		expect(allocator.reserve()).toBe(10);
	});

	it('keeps every reserved index consumed across a retry', () => {
		const allocator = createSetupItemIndexAllocator([]);

		expect(allocator.reserve()).toBe(1);
		expect(allocator.reserve()).toBe(2);
	});

	it('observes a higher canonical index returned by the backend', () => {
		const allocator = createSetupItemIndexAllocator([2]);

		expect(allocator.reserve()).toBe(3);
		allocator.observe(7);
		expect(allocator.reserve()).toBe(8);
	});

	it('ignores invalid backend indexes', () => {
		const allocator = createSetupItemIndexAllocator([1, 0, -2, 1.5]);

		allocator.observe(0);
		allocator.observe(-1);
		allocator.observe(1.5);
		expect(allocator.reserve()).toBe(2);
	});
});
