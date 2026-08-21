#!/usr/bin/env node
/**
 * Complete CLI Wizard Example
 *
 * Demonstrates a small argument parser + tuiuiu.js/prompts working together
 * for a complete CLI experience with zero external dependencies.
 *
 * Run with: pnpm tsx examples/cli-wizard.ts
 *           pnpm tsx examples/cli-wizard.ts init
 *           pnpm tsx examples/cli-wizard.ts init --name myapp --skip-prompts
 *           pnpm tsx examples/cli-wizard.ts deploy staging
 *           pnpm tsx examples/cli-wizard.ts --help
 */

/**
 * The argument parser lives in examples/_shared so this example remains
 * runnable from a standalone clone. In an application, it can be replaced
 * by any preferred CLI parser without changing the tuiuiu.js prompt code.
 */
import { createCLI, type Formatter } from './_shared/cli-args-parser.js'
import { prompt } from '../src/interaction/index.js'
import { c } from '../src/colors/index.js'

// =============================================================================
// Theme - Using tuiuiu.js/colors
// =============================================================================

const theme: Formatter = {
  'section-header': s => c.bold.white(s),
  'program-name': s => c.cyan.bold(s),
  'version': s => c.green(s),
  'description': s => c.dim(s),
  'command-name': s => c.yellow(s),
  'command-description': s => c.white(s),
  'option-flag': s => c.green(s),
  'option-type': s => c.cyan(s),
  'option-default': s => c.dim(s),
  'global-option-flag': s => c.green(s),
  'global-option-type': s => c.cyan(s),
  'global-option-default': s => c.dim(s),
  'positional-name': s => c.yellow(s),
  'error-message': s => c.red(s),
  'error-header': s => c.red.bold(s),
}

// =============================================================================
// CLI Definition
// =============================================================================

const cli = createCLI({
  name: 'wizard',
  version: '1.0.0',
  description: 'Example CLI demonstrating argument parsing + tuiuiu.js prompts',
  formatter: theme,
  autoShort: true,

  // Global options (available to all commands)
  options: {
    verbose: {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
    },
    'skip-prompts': {
      type: 'boolean',
      description: 'Skip interactive prompts (use defaults/flags)',
      default: false,
    },
  },

  commands: {
    // ==========================================================================
    // init command - Project scaffolding wizard
    // ==========================================================================
    init: {
      description: 'Initialize a new project',
      options: {
        name: {
          type: 'string',
          description: 'Project name',
        },
        template: {
          type: 'string',
          description: 'Project template',
          choices: ['minimal', 'standard', 'full'],
        },
        features: {
          type: 'array',
          description: 'Features to enable (comma-separated)',
        },
      },
      handler: async (result) => {
        const skipPrompts = result.options['skip-prompts'] as boolean
        const verbose = result.options.verbose as boolean

        console.log(c.cyan.bold('\n  Project Initialization Wizard\n'))

        // Get project name - from flag or prompt
        let name = result.options.name as string | undefined
        if (!name && !skipPrompts) {
          name = await prompt.input('Project name:', {
            default: 'my-project',
            validate: v => /^[a-z0-9-]+$/.test(v) || 'Use lowercase letters, numbers, and dashes only',
          })
        }
        name = name || 'my-project'

        // Get template - from flag or prompt
        let template = result.options.template as string | undefined
        if (!template && !skipPrompts) {
          template = await prompt.select(
            'Select template:',
            ['minimal', 'standard', 'full'] as const,
            { default: 'standard' }
          )
        }
        template = template || 'standard'

        // Get features - from flag or prompt
        let features = result.options.features as string[] | undefined
        if (!features && !skipPrompts) {
          features = await prompt.checkbox(
            'Select features:',
            ['typescript', 'eslint', 'prettier', 'vitest', 'husky'] as const,
            { default: ['typescript', 'eslint'], min: 1 }
          )
        }
        features = features || ['typescript']

        // Confirm
        if (!skipPrompts) {
          console.log('')
          const confirmed = await prompt.confirm('Create project with these settings?', { default: true })
          if (!confirmed) {
            console.log(c.yellow('\n  Cancelled.\n'))
            return
          }
        }

        // "Create" the project
        console.log('')
        console.log(c.green.bold('  Creating project...\n'))
        console.log(`    ${c.dim('Name:')}     ${c.white(name)}`)
        console.log(`    ${c.dim('Template:')} ${c.white(template)}`)
        console.log(`    ${c.dim('Features:')} ${c.white(features.join(', '))}`)

        if (verbose) {
          console.log(c.dim('\n    [verbose] Would create directories and files here...'))
        }

        console.log(c.green('\n  Done!\n'))
      },
    },

    // ==========================================================================
    // deploy command - Deployment wizard
    // ==========================================================================
    deploy: {
      description: 'Deploy to an environment',
      positional: [
        {
          name: 'environment',
          description: 'Target environment',
          required: false,
        },
      ],
      options: {
        tag: {
          short: 't',
          type: 'string',
          description: 'Version tag to deploy',
        },
        force: {
          short: 'f',
          type: 'boolean',
          description: 'Skip confirmation',
          default: false,
        },
      },
      handler: async (result) => {
        const skipPrompts = result.options['skip-prompts'] as boolean
        const force = result.options.force as boolean

        console.log(c.cyan.bold('\n  Deployment Wizard\n'))

        // Get environment - from positional or prompt
        let env = result.positional.environment as string | undefined
        if (!env && !skipPrompts) {
          env = await prompt.select(
            'Select environment:',
            ['development', 'staging', 'production'] as const,
            { default: 'staging' }
          )
        }
        env = env || 'staging'

        // Get tag - from flag or prompt with autocomplete
        let tag = result.options.tag as string | undefined
        if (!tag && !skipPrompts) {
          // Simulate available tags
          const availableTags = ['v1.0.0', 'v1.0.1', 'v1.1.0', 'v1.2.0', 'v2.0.0-beta', 'latest', 'main']
          tag = await prompt.autocomplete('Select version tag:', availableTags, {
            maxSuggestions: 5,
          })
        }
        tag = tag || 'latest'

        // Production warning
        if (env === 'production' && !force && !skipPrompts) {
          console.log(c.yellow.bold('\n  Warning: You are deploying to PRODUCTION!\n'))

          const password = await prompt.password('Enter deployment key to confirm:')
          if (password !== 'deploy') {
            console.log(c.red('\n  Invalid key. Deployment cancelled.\n'))
            return
          }
        }

        // Final confirmation
        if (!force && !skipPrompts) {
          console.log('')
          const confirmed = await prompt.confirm(`Deploy ${tag} to ${env}?`, { default: true })
          if (!confirmed) {
            console.log(c.yellow('\n  Cancelled.\n'))
            return
          }
        }

        // "Deploy"
        console.log('')
        console.log(c.green.bold(`  Deploying ${tag} to ${env}...`))
        console.log(c.dim('    - Building image...'))
        console.log(c.dim('    - Pushing to registry...'))
        console.log(c.dim('    - Updating deployment...'))
        console.log(c.green('\n  Deployment complete!\n'))
      },
    },

    // ==========================================================================
    // config command - Interactive configuration
    // ==========================================================================
    config: {
      description: 'Configure settings',
      commands: {
        set: {
          description: 'Set a configuration value',
          positional: [
            { name: 'key', description: 'Config key', required: true },
            { name: 'value', description: 'Config value' },
          ],
          handler: async (result) => {
            const key = result.positional.key as string
            let value = result.positional.value as string | undefined

            if (!value) {
              value = await prompt.input(`Value for "${key}":`)
            }

            console.log(c.green(`\n  Set ${key} = ${value}\n`))
          },
        },
        list: {
          description: 'List all configuration',
          handler: async () => {
            console.log(c.cyan.bold('\n  Configuration\n'))
            console.log(`    ${c.dim('api.url')}      = ${c.white('https://api.example.com')}`)
            console.log(`    ${c.dim('api.timeout')}  = ${c.white('30000')}`)
            console.log(`    ${c.dim('log.level')}    = ${c.white('info')}`)
            console.log('')
          },
        },
      },
    },
  },
})

// =============================================================================
// Run CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2)

  // Handle help flag
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    // Find command path for contextual help
    const commandPath = args.filter(a => !a.startsWith('-'))
    console.log(cli.help(commandPath))
    return
  }

  try {
    await cli.run(args)
  } catch (error) {
    if (error instanceof Error) {
      console.error(c.red(`\nError: ${error.message}\n`))
    }
    process.exit(1)
  }
}

main()
