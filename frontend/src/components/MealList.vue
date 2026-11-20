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
						:class="['tag', `tag--${label.replace(' ', '-')}`]"
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
	gap: 0.6rem;
	width: 100%;
	min-height: 0;
}

.meal-list h2 {
	margin-bottom: 0.25rem;
}

.meal-list__search-label {
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--color-muted);
}

.meal-list__search {
	width: 100%;
	padding: 0.65rem 0.9rem;
	border: 1.5px solid var(--color-border-strong);
	border-radius: 999px;
	background: var(--color-surface-hover);
	font: inherit;
}

.meal-list__search:focus-visible {
	border-color: var(--color-accent);
	background: var(--color-surface);
}

.meal-list__options {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
	margin: 0;
	padding: 0.2rem 0.4rem 0.2rem 0.2rem;
	border: 0;
	overflow-y: auto;
}

.meal-option {
	display: grid;
	grid-template-columns: auto 1fr;
	column-gap: 0.65rem;
	align-items: start;
	padding: 0.7rem 0.85rem;
	border: 1px solid var(--color-border);
	border-radius: 0.65rem;
	background: var(--color-surface);
	cursor: pointer;
	transition: background-color 0.15s, border-color 0.15s;
}

.meal-option:hover {
	background: var(--color-surface-hover);
	border-color: var(--color-border-strong);
}

.meal-option:has(input:checked) {
	border-color: var(--color-accent);
	box-shadow: inset 4px 0 0 var(--color-accent);
	background: var(--color-accent-soft);
}

.meal-option--all .meal-option__name {
	color: var(--color-primary-light);
}

.meal-option input {
	margin-top: 0.3rem;
	accent-color: var(--color-accent);
}

.meal-option__name {
	font-weight: 600;
	line-height: 1.35;
}

.meal-option__details {
	grid-column: 2;
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem;
	align-items: center;
	margin-top: 0.3rem;
	color: var(--color-muted);
	font-size: 0.875rem;
}

.meal-list__empty {
	color: var(--color-muted);
}

/* Small screens: the list scrolls by itself, so the map stays close */
@media (max-width: 51.99rem) {
	.meal-list__options {
		max-height: 45vh;
	}
}
</style>
