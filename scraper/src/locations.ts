import { readFile, writeFile } from 'node:fs/promises'

import type { CanteenLocation } from './types.ts'

/**
 * One entry of canteen-locations.json. lon/lat are missing until "npm run geocode" has filled them.
 */
export interface LocationEntry {
	address: string
	lon?: number
	lat?: number
}

/**
 * Checks that a value from the JSON file has the shape of a LocationEntry.
 * @param value - Parsed JSON value
 * @returns true if address is a string and lon/lat are numbers or missing
 */
function isLocationEntry (value: unknown): value is LocationEntry {
	if (typeof value !== 'object' || value === null) {
		return false
	}
	const entry = value as Record<string, unknown>
	return typeof entry.address === 'string' &&
		(entry.lon === undefined || typeof entry.lon === 'number') &&
		(entry.lat === undefined || typeof entry.lat === 'number')
}

/**
 * Reads canteen-locations.json. Keys that are not "<number>-<number>" (like "info") are skipped.
 * Key format: "<ortId>-<mensaId>", e.g. "1-1" for Kiel / Mensa I.
 * @param path - Path to the JSON file
 * @returns Map from key to entry
 */
export async function readLocationFile (path: string): Promise<Map<string, LocationEntry>> {
	const raw: unknown = JSON.parse(await readFile(path, 'utf-8'))
	if (typeof raw !== 'object' || raw === null) {
		throw new Error(`${path} must contain a JSON object`)
	}

	const entries = new Map<string, LocationEntry>()
	for (const [key, value] of Object.entries(raw)) {
		if (!/^\d+-\d+$/.test(key)) {
			continue // e.g. the "info" comment field
		}
		if (!isLocationEntry(value)) {
			throw new Error(`Invalid entry "${key}" in ${path}`)
		}
		entries.set(key, value)
	}
	return entries
}

/**
 * Writes canteen-locations.json back (tab-indented, comment field first).
 * @param path - Path to the JSON file
 * @param info - Text for the "info" comment field
 * @param entries - Entries to write
 */
export async function writeLocationFile (path: string, info: string, entries: Map<string, LocationEntry>): Promise<void> {
	const json = { info, ...Object.fromEntries(entries) }
	await writeFile(path, `${JSON.stringify(json, null, '\t')}\n`, 'utf-8')
}

/**
 * Loads only the canteens whose position is known (address + lon + lat).
 * @param path - Path to the JSON file
 * @returns Map from key to location
 */
export async function loadLocations (path: string): Promise<Map<string, CanteenLocation>> {
	const locations = new Map<string, CanteenLocation>()
	for (const [key, entry] of await readLocationFile(path)) {
		if (entry.lon !== undefined && entry.lat !== undefined) {
			locations.set(key, { address: entry.address, lon: entry.lon, lat: entry.lat })
		}
	}
	return locations
}
