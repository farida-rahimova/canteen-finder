import { readLocationFile, writeLocationFile } from './locations.ts'

const LOCATIONS_FILE = new URL('../data/canteen-locations.json', import.meta.url).pathname
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const INFO = 'Positions of the canteens (WGS84). Key: <ort>-<mensa> as in the studentenwerk.sh URL. Addresses are maintained by hand; lon/lat are filled by "npm run geocode" and checked on a map.'

/**
 * Nominatim allows at most one request per second.
 * @param ms - Milliseconds
 * @returns Promise that resolves after the delay
 */
async function sleep (ms: number): Promise<void> {
	await new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

/**
 * Asks OpenStreetMap Nominatim for the position of an address.
 * @param address - Postal address
 * @returns Longitude/latitude or undefined if nothing was found
 */
async function geocode (address: string): Promise<{ lon: number, lat: number } | undefined> {
	const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&countrycodes=de&q=${encodeURIComponent(address)}`
	const response = await fetch(url, {
		headers: [['User-Agent', 'CanteenFinder student project (HAW Kiel)']],
	})
	if (!response.ok) {
		throw new Error(`Nominatim answered with HTTP ${String(response.status)}`)
	}

	const results: unknown = await response.json()
	if (!Array.isArray(results) || results.length === 0) {
		return undefined
	}
	const first: unknown = results[0]
	if (typeof first !== 'object' || first === null) {
		return undefined
	}
	const { lon, lat } = first as Record<string, unknown>
	if (typeof lon !== 'string' || typeof lat !== 'string') {
		return undefined
	}
	// 6 decimals ≈ 10 cm precision, enough for a map
	return { lon: Number(Number(lon).toFixed(6)), lat: Number(Number(lat).toFixed(6)) }
}

/**
 * Fills lon/lat for every entry that does not have a position yet and prints a map link to check it.
 */
async function main (): Promise<void> {
	const entries = await readLocationFile(LOCATIONS_FILE)

	for (const [key, entry] of entries) {
		if (entry.lon !== undefined && entry.lat !== undefined) {
			console.info(`${key.padEnd(5)} already has a position – skipped`)
			continue
		}
		const position = await geocode(entry.address)
		await sleep(1100)

		if (position === undefined) {
			console.warn(`${key.padEnd(5)} ⚠ nothing found for "${entry.address}" – please add lon/lat by hand`)
			continue
		}
		entries.set(key, { ...entry, ...position })
		console.info(`${key.padEnd(5)} ${entry.address.padEnd(45)} https://www.openstreetmap.org/?mlat=${String(position.lat)}&mlon=${String(position.lon)}#map=18/${String(position.lat)}/${String(position.lon)}`)
	}

	await writeLocationFile(LOCATIONS_FILE, INFO, entries)
	console.info('\nSaved. Open every link above and check that the marker is on the right building.')
}

try {
	await main()
} catch (error) {
	console.error(error)
	process.exitCode = 1
}
