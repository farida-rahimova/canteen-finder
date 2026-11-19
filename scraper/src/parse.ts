import * as cheerio from 'cheerio'

import type { DayMenu, Meal, SelectOption } from './types.ts'

/**
 * Codes from the attribute data-arten and their readable names.
 * Taken from the filter legend on studentenwerk.sh (filter type 3).
 */
const LABELS: Partial<Record<string, string>> = {
	BIO: 'organic',
	G: 'poultry',
	L: 'lamb',
	R: 'beef',
	S: 'pork',
	STF: 'street food',
	ve: 'vegetarian',
	vn: 'vegan',
}

/**
 * Reads all options of a <select> element, e.g. id "ort" (locations) or "mensa" (canteens).
 * @param html - Page HTML
 * @param selectId - id of the select element
 * @returns Options with numeric id and visible name (empty placeholder options are skipped)
 */
export function parseSelectOptions (html: string, selectId: string): SelectOption[] {
	const $ = cheerio.load(html)
	const options: SelectOption[] = []
	$(`select#${selectId} option`).each((_, element) => {
		const id = Number.parseInt($(element).attr('value') ?? '', 10)
		const name = $(element).text().trim()
		if (!Number.isNaN(id) && name !== '') {
			options.push({ id, name })
		}
	})
	return options
}

/**
 * Turns a German price like "2,35 €" into the number 2.35.
 * @param text - Price text
 * @returns Price or null if no number was found
 */
export function parsePrice (text: string | undefined): number | null {
	if (text === undefined) {
		return null
	}
	const value = Number.parseFloat(text.replace(',', '.').replace(/[^\d.]/g, ''))
	return Number.isNaN(value) ? null : value
}

/**
 * Splits a value like "|Sf|GlW|" into ["Sf", "GlW"].
 * @param value - Attribute value
 * @returns List of codes
 */
function splitCodes (value: string | undefined): string[] {
	return (value ?? '').split('|').filter((code) => code !== '')
}

/**
 * Reads the menu of one day from a canteen page.
 * The page contains the whole week; every day is a ".tag_headline" block with data-day="YYYY-MM-DD".
 * @param html - Page HTML of one canteen (?ort=…&mensa=…)
 * @param day - Date as YYYY-MM-DD
 * @returns Meals of that day; closed is true if the canteen is closed or the day is missing
 */
export function parseDayMenu (html: string, day: string): DayMenu {
	const $ = cheerio.load(html)
	const dayBlock = $(`.tag_headline[data-day="${day}"]`)

	if (dayBlock.length === 0 || dayBlock.find('.mensa_menu_geschlossen').length > 0) {
		return { closed: true, meals: [] }
	}

	const meals: Meal[] = []
	dayBlock.find('.mensa_menu_detail').each((_, element) => {
		const meal = $(element)

		// Name: remove the allergen hints like "(Sf, GlW)", turn line breaks into spaces, drop a trailing comma
		const nameElement = meal.find('.menu_name').clone()
		nameElement.find('.mensa_zusatz').remove()
		nameElement.find('br').replaceWith(' ')
		const name = nameElement.text()
			.replace(/\s+/g, ' ')
			.replace(/\s+,/g, ',')
			.trim()
			.replace(/,$/, '')

		if (name === '') {
			return
		}

		const prices = meal.find('.menu_preis span').map((__, span) => $(span).text()).get()

		meals.push({
			name,
			category: meal.find('.menu_art span').first().text().trim(),
			priceStudents: parsePrice(prices[0]),
			priceEmployees: parsePrice(prices[1]),
			priceGuests: parsePrice(prices[2]),
			labels: splitCodes(meal.attr('data-arten'))
				.map((code) => LABELS[code])
				.filter((label): label is string => label !== undefined),
			allergens: splitCodes(meal.attr('data-allergene')),
		})
	})

	return { closed: meals.length === 0, meals }
}
