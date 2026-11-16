import { tsdownConfig } from '@alessiofrittoli/package-configs/tsdown'
import { parseTsConfig } from '@alessiofrittoli/tsconfig'
import { join, resolve } from 'path'

const tsConfigFile = 'tsconfig.build.json'
const parsedTsConfig = parseTsConfig({ filepath: tsConfigFile })
const outputDirectory = parsedTsConfig.options.outDir || 'dist'

export default tsdownConfig(({ outDir = outputDirectory }) => ({
	outDir,
	parsedTsConfig,
	entry: ['src/**/index.(ts|tsx)'],
	tsconfig: resolve(process.cwd(), tsConfigFile),
	copy: [
		{
			from: 'src/theme/style.css',
			to: join(outDir, 'theme'),
		},
	],
	css: {
		inject: true,
	},
	checks: {
		moduleLevelDirective: false, // to suppress warnings about "use client" directives in non-entry modules
	},
}))
