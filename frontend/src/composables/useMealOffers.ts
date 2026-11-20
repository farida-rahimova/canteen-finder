import { computed, ref } from 'vue'

import type { MealOffer, MealSummary } from '../types'

import { fetchMealOffers } from '../services/wfs'

/**
 * Loads today's meal offers and derives the meal list from them.
 * @returns Reactive state and a load function
 */
export function useMealOffers () {
	const offers = ref<MealOffer[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)

	/** One entry per meal name, sorted alphabetically, with the number of canteens serving it. */
	const meals = computed<MealSummary[]>(() => {
		const byName = new Map<string, MealSummary>()
		for (const offer of offers.value) {
			const existing = byName.get(offer.mealName)
			if (existing === undefined) {
				byName.set(offer.mealName, { name: offer.mealName, canteenCount: 1, labels: [...offer.labels] })
			} else {
				existing.canteenCount += 1
				existing.labels = [...new Set([...existing.labels, ...offer.labels])]
			}
		}
		return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
	})

	/**
	 * (Re)loads the offers from the WFS. Errors are shown in the page, never thrown.
	 */
	function load (): void {
		loading.value = true
		error.value = null
		fetchMealOffers()
			.then((result) => {
				offers.value = result
			})
			.catch((cause: unknown) => {
				error.value = cause instanceof Error ? cause.message : 'Unknown error'
			})
			.finally(() => {
				loading.value = false
			})
	}

	return { offers, meals, loading, error, load }
}
