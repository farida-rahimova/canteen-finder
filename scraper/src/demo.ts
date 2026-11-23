import type { CanteenSource, Meal } from './types.ts'

import { createPool, replaceMeals, upsertCanteen } from './db.ts'
import { loadLocations } from './locations.ts'

/**
 * Demo mode: saves SAMPLE meals for today, for days when every canteen is closed
 * (weekends, public holidays, semester break). It works offline.
 * The meals get the category DEMO_CATEGORY, so the app can show a clear "demo data" notice.
 * Running "npm run scrape" afterwards replaces them with the real menu.
 */
export const DEMO_CATEGORY = 'Demo'

const LOCATIONS_FILE = new URL('../data/canteen-locations.json', import.meta.url).pathname

/**
 * Creates one sample meal.
 * @param name - Meal name
 * @param prices - Prices for students, employees, guests
 * @param labels - e.g. ["vegan"]
 * @param allergens - Allergen codes
 * @returns Meal in demo category
 */
function meal (name: string, prices: [number, number, number], labels: string[], allergens: string[]): Meal {
	return { name, category: DEMO_CATEGORY, priceStudents: prices[0], priceEmployees: prices[1], priceGuests: prices[2], labels, allergens }
}

const PASTA = meal('Pasta with tomato and basil sauce', [2.4, 4.2, 5.2], ['vegetarian', 'vegan'], ['GlW'])
const CURRY = meal('Chicken curry with jasmine rice', [3.6, 5.4, 6.4], ['poultry'], ['Sf'])
const SCHNITZEL = meal('Pork schnitzel with French fries', [3.4, 5.1, 6.1], ['pork'], ['GlW', 'Ei'])
const CHILI = meal('Vegan chili sin carne with bread', [2.75, 4.6, 5.6], ['vegetarian', 'vegan'], ['GlW', 'So'])
const SOUP = meal('Lentil soup with baguette', [1.9, 3.2, 4.0], ['vegetarian', 'vegan'], ['GlW', 'Sl'])
const FISH = meal('Baked fish fillet with potatoes', [3.9, 5.7, 6.7], [], ['Fi', 'Mi'])

/**
 * The canteens as found by "npm run discover", each with its sample meals.
 * The same meal at several canteens shows the filter on the map well.
 */
const DEMO_MENU: { canteen: CanteenSource, meals: Meal[] }[] = [
	{ canteen: { ortId: 1, mensaId: 1, name: 'Mensa I with cafeteria and café lounge', city: 'Kiel' }, meals: [PASTA, CURRY, SCHNITZEL, CHILI] },
	{ canteen: { ortId: 1, mensaId: 2, name: 'Mensa II with cafeteria and café lounge', city: 'Kiel' }, meals: [PASTA, SOUP, FISH] },
	{ canteen: { ortId: 1, mensaId: 4, name: 'Cafeteria Kesselhaus', city: 'Kiel' }, meals: [SOUP, CHILI] },
	{ canteen: { ortId: 1, mensaId: 5, name: 'Schwentine canteen', city: 'Kiel' }, meals: [PASTA, SCHNITZEL] },
	{ canteen: { ortId: 1, mensaId: 6, name: 'American Diner', city: 'Kiel' }, meals: [SCHNITZEL] },
	{ canteen: { ortId: 2, mensaId: 7, name: 'Mensa Flensburg with cafeteria', city: 'Flensburg' }, meals: [PASTA, CURRY, FISH] },
	{ canteen: { ortId: 2, mensaId: 14, name: 'Cafeteria B Building', city: 'Flensburg' }, meals: [SOUP] },
	{ canteen: { ortId: 3, mensaId: 8, name: 'Mensa Lübeck with cafeteria', city: 'Lübeck' }, meals: [PASTA, CHILI, FISH] },
	{ canteen: { ortId: 3, mensaId: 9, name: 'Cafeteria conservatory', city: 'Lübeck' }, meals: [SOUP] },
	{ canteen: { ortId: 4, mensaId: 11, name: 'Mensa Heide with cafeteria', city: 'Heide' }, meals: [PASTA, CURRY] },
	{ canteen: { ortId: 5, mensaId: 10, name: 'Cafeteria Wedel', city: 'Wedel' }, meals: [CHILI] },
]

/**
 * Saves the demo canteens and today's sample meals.
 */
async function main (): Promise<void> {
	const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date())
	const locations = await loadLocations(LOCATIONS_FILE)
	const pool = createPool()
	let count = 0

	try {
		for (const { canteen, meals } of DEMO_MENU) {
			const key = `${String(canteen.ortId)}-${String(canteen.mensaId)}`
			const canteenId = await upsertCanteen(pool, canteen, locations.get(key))
			await replaceMeals(pool, canteenId, day, meals)
			count += meals.length
		}
		console.info(`Demo data saved: ${String(count)} sample meals for ${day}.`)
		console.info('The app shows a "demo data" notice. Run "npm run scrape" on a weekday for the real menu.')
	} finally {
		await pool.end()
	}
}

try {
	await main()
} catch (error) {
	console.error(error)
	process.exitCode = 1
}
