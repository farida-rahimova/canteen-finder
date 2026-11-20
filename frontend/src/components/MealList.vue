<script setup lang="ts">
import { computed, ref } from 'vue'

import type { MealSummary } from '../types'

const props = defineProps<{
	meals: MealSummary[]
}>()

/** Name of the selected meal ("" = no meal selected, all canteens are shown). */
const selectedMeal = defineModel<string>({ required: true })

const search = ref('')

/** Meals whose name or labels (e.g. "vegan") contain the search text (case-insensitive). */
const visibleMeals = computed(() => {
	const text = search.value.trim().toLowerCase()
	return text === ''
		? props.meals
		: props.meals.filter((meal) => [meal.name, ...meal.labels].some((value) => value.toLowerCase().includes(text)))
})

/**
 * Text like "1 canteen" / "3 canteens".
 * @param count - Number of canteens
 * @returns Readable text
 */
function canteenText (count: number): string {
	return count === 1 ? '1 canteen' : `${String(count)} canteens`
}
</script>

<template>
	<section
		class="meal-list"
		aria-labelledby="meal-list-heading"
	>
		<h2 id="meal-list-heading">
			Meals today
		</h2>

		<label
			class="meal-list__search-label"
			for="meal-search"
		>Search meals</label>
		<input
			id="meal-search"
			v-model="search"
			class="meal-list__search"
			type="search"
			autocomplete="off"
			placeholder="e.g. curry, pasta, vegan"
		>

		<fieldset class="meal-list__options">
			<legend class="visually-hidden">
				Choose a meal
			</legend>

			<label class="meal-option meal-option--all">
				<input
					v-model="selectedMeal"
					type="radio"
					name="meal"
					value=""
				>
				<span class="meal-option__name">All canteens</span>
			</label>

			<label
				v-for="meal in visibleMeals"
				:key="meal.name"
				class="meal-option"
			>
				<input
					v-model="selectedMeal"
					type="radio"
					name="meal"
					:value="meal.name"
				>
				<span class="meal-option__name">{{ meal.name }}</span>
				<span class="meal-option__details">
					{{ canteenText(meal.canteenCount) }}
					<span
						v-for="label in meal.labels"
						:key="label"
						class="tag"
					>{{ label }}</span>
				</span>
			</label>
		</fieldset>

		<p
			v-if="visibleMeals.length === 0"
			class="meal-list__empty"
			role="status"
		>
			No meal matches “{{ search }}”.
		</p>
	</section>
</template>

<style scoped>
.meal-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	min-height: 0;
}

.meal-list__search {
	width: 100%;
	padding: 0.6rem 0.75rem;
	border: 2px solid var(--color-border);
	border-radius: 0.5rem;
	font: inherit;
}

.meal-list__options {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	margin: 0;
	padding: 0 0.25rem 0 0;
	border: 0;
	overflow-y: auto;
}

/* Small screens: the list scrolls by itself, so the map stays close */
@media (max-width: 51.99rem) {
	.meal-list__options {
		max-height: 45vh;
	}
}

.meal-option {
	display: grid;
	grid-template-columns: auto 1fr;
	column-gap: 0.6rem;
	align-items: start;
	padding: 0.6rem 0.75rem;
	border: 1px solid var(--color-border);
	border-radius: 0.5rem;
	cursor: pointer;
}

.meal-option:hover {
	background: var(--color-surface-hover);
}

.meal-option:has(input:checked) {
	border-color: var(--color-accent);
	background: var(--color-accent-soft);
}

.meal-option input {
	margin-top: 0.3rem;
	accent-color: var(--color-accent);
}

.meal-option__name {
	font-weight: 600;
}

.meal-option__details {
	grid-column: 2;
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem;
	align-items: center;
	color: var(--color-muted);
	font-size: 0.9rem;
}

.meal-list__empty {
	color: var(--color-muted);
}
</style>
