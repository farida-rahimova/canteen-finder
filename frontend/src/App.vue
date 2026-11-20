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

const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

onMounted(load)
</script>

<template>
	<a
		class="skip-link"
		href="#results"
	>Skip to the map and results</a>

	<header class="app-header">
		<h1>CanteenFinder</h1>
		<p class="app-header__subtitle">
			Today’s meals in the canteens of the Studentenwerk Schleswig-Holstein · {{ today }}
		</p>
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
		<p>
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
	background: var(--color-primary);
	color: #ffffff;
	z-index: 10;
}

.skip-link:focus {
	top: 1rem;
}

.app-header {
	padding: 1rem 1.25rem;
	background: var(--color-primary);
	color: #ffffff;
}

.app-header__subtitle {
	margin: 0.25rem 0 0;
}

.app-main {
	display: grid;
	gap: 1rem;
	padding: 1rem 1.25rem;
}

.app-main__results {
	display: flex;
	flex-direction: column;
	gap: 1rem;
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
	padding: 0.75rem 1rem;
	border-radius: 0.5rem;
	background: var(--color-surface);
	border: 1px solid var(--color-border);
}

.status--error {
	border-color: var(--color-error);
}

.status--error p {
	margin: 0 0 0.5rem;
}

.app-footer {
	padding: 1rem 1.25rem;
	color: var(--color-muted);
	font-size: 0.9rem;
}

/* Wider screens: meal list on the left, map and results on the right */
@media (min-width: 52rem) {
	.app-main {
		grid-template-columns: minmax(16rem, 22rem) 1fr;
		align-items: start;
	}

	.app-main__meals {
		position: sticky;
		top: 1rem;
		display: flex;
		max-height: calc(100vh - 2rem);
	}

	.app-main__map {
		height: 60vh;
	}
}

/* Phones in landscape: little height, so a compact header and a taller map */
@media (orientation: landscape) and (max-height: 32rem) {
	.app-header {
		padding: 0.5rem 1.25rem;
	}

	.app-header h1 {
		font-size: 1.25rem;
	}

	.app-header__subtitle {
		font-size: 0.85rem;
	}

	.app-main__map {
		height: 80vh;
	}
}
</style>
