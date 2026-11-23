<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import CanteenList from './components/CanteenList.vue'
import CanteenMap from './components/CanteenMap.vue'
import MealList from './components/MealList.vue'
import { useMealOffers } from './composables/useMealOffers'

const { offers, meals, loading, error, load } = useMealOffers()

/** Selected meal name ("" = none). */
const selectedMeal = ref('')

/** Offers of the selected meal, sorted by city and canteen name. */
const selectedOffers = computed(() => offers.value
	.filter((offer) => offer.mealName === selectedMeal.value)
	.sort((a, b) => `${a.canteen.city} ${a.canteen.name}`.localeCompare(`${b.canteen.city} ${b.canteen.name}`)))

/** Canteens to highlight on the map. */
const highlightedCanteens = computed(() => selectedOffers.value.map((offer) => offer.canteen))

/** True when the meals come from the scraper's demo mode ("npm run demo"), not from the real menu. */
const isDemo = computed(() => offers.value.some((offer) => offer.category === 'Demo'))

/** Number of canteens that serve at least one meal today. */
const openCanteens = computed(() => new Set(offers.value.map((offer) => offer.canteen.id)).size)

const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

onMounted(load)
</script>

<template>
	<a
		class="skip-link"
		href="#results"
	>Skip to the map and results</a>

	<header class="app-header">
		<div class="app-header__inner">
			<div class="app-header__brand">
				<svg
					class="app-header__icon"
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<path d="M7 2v8a3 3 0 0 0 2 2.8V22h2v-9.2A3 3 0 0 0 13 10V2h-2v7h-1V2H9v7H8V2zm10 0c-1.7 0-3 2-3 5v6h2v9h2V2z" />
				</svg>
				<div>
					<h1>CanteenFinder</h1>
					<p class="app-header__subtitle">
						Today’s meals in the canteens of the Studentenwerk Schleswig-Holstein
					</p>
				</div>
			</div>
			<p class="app-header__meta">
				<span class="app-header__date">{{ today }}</span>
				<span
					v-if="meals.length > 0"
					class="app-header__stats"
				>{{ meals.length }} meals · {{ openCanteens }} canteens open</span>
			</p>
		</div>
	</header>

	<main class="app-main">
		<p
			v-if="loading"
			class="status"
			role="status"
		>
			Loading today’s meals …
		</p>

		<div
			v-else-if="error !== null"
			class="status status--error"
			role="alert"
		>
			<p>The meals could not be loaded: {{ error }}</p>
			<p>Please check that GeoServer is running (<code>docker compose up -d</code>) and try again.</p>
			<button
				type="button"
				class="button"
				@click="load"
			>
				Try again
			</button>
		</div>

		<p
			v-else-if="meals.length === 0"
			class="status"
			role="status"
		>
			No meals today – all canteens are closed (for example on weekends and public holidays).
		</p>

		<p
			v-if="isDemo"
			class="status status--demo"
			role="status"
		>
			<strong>Demo data:</strong> these are sample meals, not today’s real menu.
			The canteens are closed today (for example on weekends or in the semester break).
		</p>

		<aside
			v-if="meals.length > 0"
			class="app-main__meals"
		>
			<MealList
				v-model="selectedMeal"
				:meals="meals"
			/>
		</aside>

		<div
			id="results"
			class="app-main__results"
			tabindex="-1"
		>
			<div class="app-main__map">
				<CanteenMap :highlighted="highlightedCanteens" />
			</div>
			<CanteenList
				:meal="selectedMeal"
				:offers="selectedOffers"
			/>
		</div>
	</main>

	<footer class="app-footer">
		<p class="app-footer__inner">
			Menu data: <a href="https://studentenwerk.sh/en/food-overview">Studentenwerk Schleswig-Holstein</a> ·
			Map: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
		</p>
	</footer>
</template>

<style scoped>
.skip-link {
	position: absolute;
	left: 1rem;
	top: -3rem;
	padding: 0.5rem 1rem;
	border-radius: 0.5rem;
	background: var(--color-surface);
	color: var(--color-primary);
	font-weight: 600;
	z-index: 10;
}

.skip-link:focus {
	top: 1rem;
}

.app-header {
	background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
	color: #ffffff;
	box-shadow: var(--shadow-md);
}

.app-header__inner,
.app-main,
.app-footer__inner {
	max-width: 90rem;
	margin: 0 auto;
}

.app-header__inner {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem 2rem;
	align-items: center;
	justify-content: space-between;
	padding: 1.1rem 1.5rem;
}

.app-header__brand {
	display: flex;
	gap: 0.9rem;
	align-items: center;
}

.app-header__icon {
	flex: none;
	width: 2.75rem;
	height: 2.75rem;
	padding: 0.55rem;
	border-radius: 0.75rem;
	background: var(--color-accent);
	fill: #ffffff;
}

.app-header__subtitle {
	margin: 0.1rem 0 0;
	color: #dbe4f0;
}

.app-header__meta {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin: 0;
}

.app-header__date,
.app-header__stats {
	padding: 0.25rem 0.8rem;
	border-radius: 999px;
	background: rgb(255 255 255 / 12%);
	font-size: 0.9rem;
	font-weight: 600;
}

.app-main {
	display: grid;
	gap: 1.25rem;
	padding: 1.5rem;
}

.app-main__meals {
	padding: 1.1rem;
	border-radius: var(--radius);
	background: var(--color-surface);
	box-shadow: var(--shadow-sm);
}

.app-main__results {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	min-width: 0;
}

.app-main__results:focus {
	outline: none;
}

.app-main__map {
	height: 55vh;
}

.status {
	grid-column: 1 / -1;
	margin: 0;
	padding: 1rem 1.25rem;
	border-radius: var(--radius);
	background: var(--color-surface);
	box-shadow: var(--shadow-sm);
	border-left: 5px solid var(--color-primary-light);
}

.status--demo {
	border-left-color: var(--color-accent);
	background: var(--color-accent-soft);
}

.status--error {
	border-left-color: var(--color-error);
}

.status--error p {
	margin: 0 0 0.5rem;
}

.app-footer {
	border-top: 1px solid var(--color-border);
	color: var(--color-muted);
	font-size: 0.9rem;
}

.app-footer__inner {
	margin-block: 0;
	padding: 1.25rem 1.5rem;
}

/* Wider screens: meal list on the left, map and results on the right */
@media (min-width: 52rem) {
	.app-main {
		grid-template-columns: minmax(17rem, 24rem) 1fr;
		align-items: start;
	}

	.app-main__meals {
		position: sticky;
		top: 1rem;
		display: flex;
		max-height: calc(100vh - 2rem);
	}

	.app-main__map {
		height: 62vh;
	}
}

/* Phones: less padding, smaller header */
@media (max-width: 40rem) {
	.app-header__inner,
	.app-main,
	.app-footer__inner {
		padding-inline: 1rem;
	}

	h1 {
		font-size: 1.4rem;
	}
}

/* Phones in landscape: little height, so a compact header and a taller map */
@media (orientation: landscape) and (max-height: 32rem) {
	.app-header__inner {
		padding-block: 0.5rem;
	}

	.app-header__subtitle {
		display: none;
	}

	.app-header__icon {
		width: 2.25rem;
		height: 2.25rem;
	}

	.app-main__map {
		height: 80vh;
	}
}
</style>
