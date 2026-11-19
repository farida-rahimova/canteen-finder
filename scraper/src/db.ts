import pg from 'pg'

import type { CanteenLocation, CanteenSource, Meal } from './types.ts'

/**
 * Creates a connection pool from the variables in the project's .env file.
 * @returns Database pool
 */
export function createPool (): pg.Pool {
	return new pg.Pool({
		host: process.env.POSTGRES_HOST ?? 'localhost',
		port: Number(process.env.POSTGRES_PORT ?? '5432'),
		database: process.env.POSTGRES_DB,
		user: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
	})
}

/**
 * Decides whether a canteen is a "Cafeteria" or a "Mensa" from its name.
 * @param name - Canteen name
 * @returns Kind of canteen
 */
function kindFromName (name: string): string {
	return /cafeteria/i.test(name) && !/mensa/i.test(name) ? 'Cafeteria' : 'Mensa'
}

/**
 * Inserts or updates a canteen and returns its database id.
 * @param pool - Database pool
 * @param canteen - Canteen from the website
 * @param location - Position from canteen-locations.json (undefined if not known yet)
 * @returns Database id of the canteen
 */
export async function upsertCanteen (pool: pg.Pool, canteen: CanteenSource, location: CanteenLocation | undefined): Promise<number> {
	const result = await pool.query<{ id: number }>(
		`INSERT INTO canteens (ort_id, mensa_id, name, city, kind, address, geom)
		VALUES ($1, $2, $3, $4, $5, $6,
			CASE WHEN $7::float8 IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint($7, $8), 4326) END)
		ON CONFLICT (ort_id, mensa_id) DO UPDATE
		SET name = EXCLUDED.name, city = EXCLUDED.city, kind = EXCLUDED.kind,
			address = EXCLUDED.address, geom = EXCLUDED.geom
		RETURNING id`,
		[
			canteen.ortId,
			canteen.mensaId,
			canteen.name,
			canteen.city,
			kindFromName(canteen.name),
			location?.address ?? null,
			location?.lon ?? null,
			location?.lat ?? null,
		],
	)
	const row = result.rows[0]
	if (row === undefined) {
		throw new Error(`Could not save canteen ${canteen.name}`)
	}
	return row.id
}

/**
 * Replaces all meals of one canteen on one day (inside a transaction).
 * Running the scraper twice therefore never creates duplicates.
 * @param pool - Database pool
 * @param canteenId - Database id of the canteen
 * @param day - Date as YYYY-MM-DD
 * @param meals - Meals of that day
 */
export async function replaceMeals (pool: pg.Pool, canteenId: number, day: string, meals: Meal[]): Promise<void> {
	const client = await pool.connect()
	try {
		await client.query('BEGIN')
		await client.query('DELETE FROM meals WHERE canteen_id = $1 AND served_on = $2', [canteenId, day])
		for (const meal of meals) {
			await client.query(
				`INSERT INTO meals (canteen_id, served_on, name, category, price_students, price_employees, price_guests, labels, allergens)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				ON CONFLICT (canteen_id, served_on, name) DO NOTHING`,
				[
					canteenId,
					day,
					meal.name,
					meal.category,
					meal.priceStudents,
					meal.priceEmployees,
					meal.priceGuests,
					meal.labels.join(', '),
					meal.allergens.join(', '),
				],
			)
		}
		await client.query('COMMIT')
	} catch (error) {
		await client.query('ROLLBACK')
		throw error
	} finally {
		client.release()
	}
}
