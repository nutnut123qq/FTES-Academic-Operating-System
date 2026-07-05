
import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import { defineConfig } from "eslint/config"

export default defineConfig([
    {
        ignores: [
            "**/.next/**",
            "**/node_modules/**",
            "**/dist/**",
            "**/out/**",
            "**/.turbo/**",
            "**/coverage/**",
            "**/.tmp-screenshot/**",
        ],
    },
    { 
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], 
        plugins: { js }, 
        extends: ["js/recommended"], 
        languageOptions: { globals: globals.browser }
    },
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        // register react-hooks so `react-hooks/*` rule names resolve (the rule is
        // kept off below; we only need the plugin loaded for the disable directives)
        plugins: { "react-hooks": pluginReactHooks },
        rules: {
            "react/display-name": "off",
            indent: ["error", 4],
            "react-hooks/exhaustive-deps": "off",
            "linebreak-style": "off",
            quotes: ["error", "double"],
            semi: ["error", "never"],
        },
    },
])
