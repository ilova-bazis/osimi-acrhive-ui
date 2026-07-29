export type SetupItemIndexAllocator = {
	reserve: () => number;
	observe: (itemIndex: number) => void;
};

const isValidItemIndex = (value: number): boolean =>
	Number.isInteger(value) && value > 0;

export const createSetupItemIndexAllocator = (
	persistedItemIndexes: readonly number[]
): SetupItemIndexAllocator => {
	let highWaterMark = 0;

	for (const itemIndex of persistedItemIndexes) {
		if (isValidItemIndex(itemIndex)) {
			highWaterMark = Math.max(highWaterMark, itemIndex);
		}
	}

	return {
		reserve: (): number => {
			highWaterMark += 1;
			return highWaterMark;
		},
		observe: (itemIndex: number): void => {
			if (isValidItemIndex(itemIndex)) {
				highWaterMark = Math.max(highWaterMark, itemIndex);
			}
		}
	};
};
