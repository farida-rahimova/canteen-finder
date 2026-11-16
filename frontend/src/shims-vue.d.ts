/**
 * Tells TypeScript (and ESLint) that importing a .vue file returns a Vue component.
 */
declare module '*.vue' {
	import type { DefineComponent } from 'vue'

	const component: DefineComponent
	export default component
}
