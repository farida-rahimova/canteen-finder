import mainConfig from '@dataport/eslint-config-geodev'
import nodeConfig from '@dataport/eslint-config-geodev/node'
import tsConfig from '@dataport/eslint-config-geodev/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
	globalIgnores(['node_modules/**']),
	{
		files: ['**/*.js', '**/*.ts'],
		extends: [mainConfig, nodeConfig],
	},
	{
		files: ['src/**/*.ts'],
		extends: [tsConfig],
	},
])
