import type { CanteenSource } from './types.ts'

import { createPool, replaceMeals, upsertCanteen } from './db.ts'
import { loadLocations } from './locations.ts'
import { parseDayMenu, parseSelectOptions } from './parse.ts'

const BASE_URL = 'https://studentenwerk.sh/en/food-overview'
const LOCATIONS_FILE = new URL('../data/canteen-locations.json', import.meta.url)
const DELAY_MS = 500

/**
 * Today's date in Kiel (not UTC) as YYYY-MM-DD.
 * @returns Date string
 */
function todayInBerlin (): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date())
}

/**
 * Waits a moment between requests, to be polite to the Studentenwerk server.
 * @param ms - Milliseconds
 * @returns Promise that resolves after the delay
 */
async function sleep (ms: number): Promise<void> {
	await new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

/**
 * Downloads a page as text.
 * @param url - Page URL
 * @returns HTML
 */
async function fetchHtml (url: string): Promise<string> {
	const response = await fetch(url, {
		// Header as [name, value] pair, so the name may contain a dash
		headers: [['User-Agent', 'CanteenFinder student project (HAW Kiel)']],
	})
	if (!response.ok) {
		throw new Error(`${url} answered with HTTP ${String(response.status)}`)
	}
	await sleep(DELAY_MS)
	return await response.text()
}

/**
 * Finds all canteens: first all locations (select "ort"), then the canteens of every location (select "mensa").
 * @returns All canteens listed on studentenwerk.sh
 */
async function discoverCanteens (): Promise<CanteenSource[]> {
	const cities = parseSelectOptions(await fetchHtml(BASE_URL), 'ort')
	const canteens: CanteenSource[] = []

	for (const city of cities) {
		const html = await fetchHtml(`${BASE_URL}?ort=${String(city.id)}`)
		for (const mensa of parseSelectOptions(html, 'mensa')) {
			canteens.push({ ortId: city.id, mensaId: mensa.id, name: mensa.name, city: city.name })
		}
	}
	return canteens
}

/**
 * Prints all canteens, so their positions can be added to canteen-locations.json.
 */
async function runDiscover (): Promise<void> {
	const canteens = await discoverCanteens()
	console.info('key   city          name')
	for (const canteen of canteens) {
		const key = `${String(canteen.ortId)}-${String(canteen.mensaId)}`
		console.info(`${key.padEnd(5)} ${canteen.city.padEnd(13)} ${canteen.name}`)
	}
}

/**
 * Saves all canteens and today's meals in the database.
 */
async function runScrape (): Promise<void> {
	const day = todayInBerlin()
	const locations = await loadLocations(LOCATIONS_FILE.pathname)
	const pool = createPool()
	let mealCount = 0

	try {
		for (const canteen of await discoverCanteens()) {
			const key = `${String(canteen.ortId)}-${String(canteen.mensaId)}`
			const location = locations.get(key)
			if (location === undefined) {
				console.warn(`⚠ No position for ${key} (${canteen.name}) – add it to data/canteen-locations.json`)
			}

			const canteenId = await upsertCanteen(pool, canteen, location)
			const html = await fetchHtml(`${BASE_URL}?ort=${String(canteen.ortId)}&mensa=${String(canteen.mensaId)}`)
			const menu = parseDayMenu(html, day)
			await replaceMeals(pool, canteenId, day, menu.meals)

			mealCount += menu.meals.length
			console.info(`${canteen.city.padEnd(13)} ${canteen.name.padEnd(45)} ${menu.closed ? 'closed' : `${String(menu.meals.length)} meals`}`)
		}
		console.info(`\nDone: ${String(mealCount)} meals for ${day}`)
	} finally {
		await pool.end()
	}
}

const mode = process.argv[2] ?? 'scrape'

try {
	if (mode === 'discover') {
		await runDiscover()
	} else {
		await runScrape()
	}
} catch (error) {
	console.error(error)
	process.exitCode = 1
}
