<script setup lang="ts">
import type { MealOffer } from '../types'

defineProps<{
	/** Selected meal ("" = none). */
	meal: string
	/** Offers of that meal, one per canteen. */
	offers: MealOffer[]
}>()

const priceFormat = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' })

/**
 * Formats a price, or a dash if the website shows none.
 * @param price - Price in euro
 * @returns e.g. "€2.40"
 */
function formatPrice (price: number | null): string {
	return price === null ? '–' : priceFormat.format(price)
}
</script>

<template>
	<section
		class="canteen-list"
		aria-live="polite"
	>
		<p
			v-if="meal === ''"
			class="canteen-list__hint"
		>
			Choose a meal to see which canteens serve it today.
		</p>

		<template v-else>
			<h2>
				{{ offers.length === 1 ? '1 canteen serves' : `${offers.length} canteens serve` }} “{{ meal }}” today
			</h2>
			<ul class="canteen-list__items">
				<li
					v-for="offer in offers"
					:key="offer.mealId"
					class="canteen-card"
				>
					<p class="canteen-card__city">
						{{ offer.canteen.city }}
					</p>
					<h3 class="canteen-card__name">
						{{ offer.canteen.name }}
					</h3>
					<p class="canteen-card__address">
						{{ offer.canteen.address }}
					</p>
					<dl class="canteen-card__prices">
						<div>
							<dt>Students</dt>
							<dd>{{ formatPrice(offer.priceStudents) }}</dd>
						</div>
						<div>
							<dt>Employees</dt>
							<dd>{{ formatPrice(offer.priceEmployees) }}</dd>
						</div>
						<div>
							<dt>Guests</dt>
							<dd>{{ formatPrice(offer.priceGuests) }}</dd>
						</div>
					</dl>
					<p
						v-if="offer.labels.length > 0"
						class="canteen-card__tags"
					>
						<span
							v-for="label in offer.labels"
							:key="label"
							:class="['tag', `tag--${label.replace(' ', '-')}`]"
						>{{ label }}</span>
					</p>
					<p
						v-if="offer.allergens.length > 0"
						class="canteen-card__allergens"
					>
						Allergens and additives: {{ offer.allergens.join(', ') }}
					</p>
				</li>
			</ul>
		</template>
	</section>
</template>

<style scoped>
.canteen-list__hint {
	margin: 0;
	padding: 1rem 1.25rem;
	border: 2px dashed var(--color-border);
	border-radius: var(--radius);
	color: var(--color-muted);
	text-align: center;
}

.canteen-list__items {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
	gap: 1rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.canteen-card {
	display: flex;
	flex-direction: column;
	padding: 1rem 1.15rem;
	border-top: 4px solid var(--color-accent);
	border-radius: var(--radius);
	background: var(--color-surface);
	box-shadow: var(--shadow-sm);
}

.canteen-card__city {
	align-self: flex-start;
	margin: 0 0 0.4rem;
	padding: 0 0.55rem;
	border-radius: 999px;
	background: var(--color-accent-soft);
	color: #9a3412;
	font-size: 0.78rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

.canteen-card__name {
	margin: 0;
	font-size: 1.05rem;
	line-height: 1.3;
}

.canteen-card__address {
	margin: 0.25rem 0 0.8rem;
	color: var(--color-muted);
	font-size: 0.9rem;
}

.canteen-card__prices {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.5rem;
	margin: 0;
	padding: 0.6rem 0.75rem;
	border-radius: 0.6rem;
	background: var(--color-page);
}

.canteen-card__prices dt {
	color: var(--color-muted);
	font-size: 0.78rem;
}

.canteen-card__prices dd {
	margin: 0;
	font-size: 1.05rem;
	font-weight: 700;
}

.canteen-card__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem;
	margin: 0.75rem 0 0;
}

.canteen-card__allergens {
	margin: 0.6rem 0 0;
	color: var(--color-muted);
	font-size: 0.82rem;
}
</style>
