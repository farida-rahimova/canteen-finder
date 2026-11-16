import mainConfig from '@dataport/eslint-config-geodev'
import browserConfig from '@dataport/eslint-config-geodev/browser'
import nodeConfig from '@dataport/eslint-config-geodev/node'
import tsConfig from '@dataport/eslint-config-geodev/typescript'
import tsVueConfig from '@dataport/eslint-config-geodev/typescript-vue'
import vueConfig from '@dataport/eslint-config-geodev/vue'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
	globalIgnores(['dist/**', 'node_modules/**']),
	{
		files: ['src/**/*.ts', 'src/**/*.vue'],
		extends: [mainConfig, browserConfig, tsConfig, tsVueConfig],
	},
	{
		files: ['src/**/*.vue'],
		extends: [vueConfig],
		rules: {
			// Course requirement: indent with tabs (also inside Vue templates)
			'vue/html-indent': ['error', 'tab'],
		},
	},
	{
		files: ['*.config.ts', '*.config.js'],
		extends: [mainConfig, nodeConfig],
	},
	{
		files: ['*.config.ts'],
		extends: [tsConfig],
	},
])
