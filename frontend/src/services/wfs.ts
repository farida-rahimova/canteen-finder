import type { MealOffer } from '../types'

/**
 * GeoServer is reached through the Vite proxy (see vite.config.ts).
 */
export const GEOSERVER_URL = '/geoserver'
export const WORKSPACE = 'canteenfinder'

/**
 * Checks that a value is a plain object, so its fields can be read safely.
 * @param value - Any value
 * @returns true for objects (not null, not arrays)
 */
function isRecord (value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Reads a text field.
 * @param record - Object to read from
 * @param key - Field name
 * @returns The text, or "" if the field is missing or not a string
 */
function readString (record: Record<string, unknown>, key: string): string {
	const value = record[key]
	return typeof value === 'string' ? value : ''
}

/**
 * Reads a number field that may be empty (e.g. a price).
 * @param record - Object to read from
 * @param key - Field name
 * @returns The number, or null
 */
function readNumber (record: Record<string, unknown>, key: string): number | null {
	const value = record[key]
	return typeof value === 'number' ? value : null
}

/**
 * Splits "vegetarian, vegan" into ["vegetarian", "vegan"].
 * @param text - Comma separated list
 * @returns List without empty entries
 */
function splitList (text: string): string[] {
	return text.split(',').map((item) => item.trim()).filter((item) => item !== '')
}

/**
 * Turns one GeoJSON feature from GeoServer into a MealOffer.
 * @param feature - One element of "features"
 * @returns The offer, or null if the feature is incomplete
 */
function toMealOffer (feature: unknown): MealOffer | null {
	if (!isRecord(feature) || !isRecord(feature.properties) || !isRecord(feature.geometry)) {
		return null
	}
	const properties = feature.properties
	const coordinates = feature.geometry.coordinates
	if (!Array.isArray(coordinates)) {
		return null
	}
	const [lon, lat] = coordinates as unknown[]
	const mealId = readNumber(properties, 'meal_id')
	const canteenId = readNumber(properties, 'canteen_id')
	const mealName = readString(properties, 'meal_name')

	if (typeof lon !== 'number' || typeof lat !== 'number' || mealId === null || canteenId === null || mealName === '') {
		return null
	}

	return {
		mealId,
		mealName,
		category: readString(properties, 'category'),
		priceStudents: readNumber(properties, 'price_students'),
		priceEmployees: readNumber(properties, 'price_employees'),
		priceGuests: readNumber(properties, 'price_guests'),
		labels: splitList(readString(properties, 'labels')),
		allergens: splitList(readString(properties, 'allergens')),
		canteen: {
			id: canteenId,
			name: readString(properties, 'canteen_name'),
			city: readString(properties, 'city'),
			address: readString(properties, 'address'),
			lon,
			lat,
		},
	}
}

/**
 * Loads all meals served today from the WFS layer canteen_meals_today (GeoJSON).
 * @param signal - Optional AbortSignal to cancel the request
 * @returns All meal offers of today (empty on days when every canteen is closed)
 */
export async function fetchMealOffers (signal?: AbortSignal): Promise<MealOffer[]> {
	const parameters = new URLSearchParams({
		service: 'WFS',
		version: '2.0.0',
		request: 'GetFeature',
		typeNames: `${WORKSPACE}:canteen_meals_today`,
		outputFormat: 'application/json',
	})
	const response = await fetch(`${GEOSERVER_URL}/${WORKSPACE}/ows?${parameters.toString()}`, { signal })
	if (!response.ok) {
		throw new Error(`WFS request failed (HTTP ${String(response.status)})`)
	}

	const collection: unknown = await response.json()
	if (!isRecord(collection) || !Array.isArray(collection.features)) {
		throw new Error('The WFS answer is not a GeoJSON FeatureCollection')
	}

	return (collection.features as unknown[])
		.map(toMealOffer)
		.filter((offer): offer is MealOffer => offer !== null)
}
