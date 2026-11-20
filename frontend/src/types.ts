/**
 * A canteen of the Studentenwerk Schleswig-Holstein with its position (WGS84).
 */
export interface Canteen {
	id: number
	name: string
	city: string
	address: string
	lon: number
	lat: number
}

/**
 * One meal served today at one canteen (one feature of the WFS layer canteen_meals_today).
 */
export interface MealOffer {
	mealId: number
	mealName: string
	category: string
	priceStudents: number | null
	priceEmployees: number | null
	priceGuests: number | null
	labels: string[]
	allergens: string[]
	canteen: Canteen
}

/**
 * One entry of the meal list: a meal name and how many canteens serve it today.
 */
export interface MealSummary {
	name: string
	canteenCount: number
	labels: string[]
}
