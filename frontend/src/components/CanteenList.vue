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
							class="tag"
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
	color: var(--color-muted);
}

.canteen-list__items {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
	gap: 0.75rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.canteen-card {
	padding: 0.9rem 1rem;
	border: 1px solid var(--color-border);
	border-left: 6px solid var(--color-accent);
	border-radius: 0.5rem;
	background: var(--color-surface);
}

.canteen-card__name {
	margin: 0;
	font-size: 1.05rem;
}

.canteen-card__address {
	margin: 0.2rem 0 0.6rem;
	color: var(--color-muted);
}

.canteen-card__prices {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem 1.2rem;
	margin: 0;
}

.canteen-card__prices dt {
	color: var(--color-muted);
	font-size: 0.85rem;
}

.canteen-card__prices dd {
	margin: 0;
	font-weight: 600;
}

.canteen-card__tags {
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem;
	margin: 0.6rem 0 0;
}

.canteen-card__allergens {
	margin: 0.5rem 0 0;
	color: var(--color-muted);
	font-size: 0.85rem;
}
</style>
