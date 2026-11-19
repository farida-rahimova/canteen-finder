/**
 * One entry of a <select> on the Studentenwerk page (a location or a canteen).
 */
export interface SelectOption {
	id: number
	name: string
}

/**
 * A canteen as found on studentenwerk.sh: identified by location id (ort) and canteen id (mensa).
 */
export interface CanteenSource {
	ortId: number
	mensaId: number
	name: string
	city: string
}

/**
 * Fixed position of a canteen (WGS84), kept by hand in data/canteen-locations.json.
 */
export interface CanteenLocation {
	address: string
	lon: number
	lat: number
}

/**
 * One meal on one day.
 */
export interface Meal {
	name: string
	category: string
	priceStudents: number | null
	priceEmployees: number | null
	priceGuests: number | null
	labels: string[]
	allergens: string[]
}

/**
 * The menu of one canteen for one day.
 */
export interface DayMenu {
	closed: boolean
	meals: Meal[]
}
