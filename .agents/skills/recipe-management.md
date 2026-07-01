# Skill: Recipe Management

## Purpose
Handle all recipe persistence — saving, loading, deleting, and exporting recipes — using localStorage. No backend in v1.

## Storage Schema

Recipes are stored under a single localStorage key: `fuji-recipes`.

Value: a JSON array of recipe objects.

```js
// Read
const recipes = JSON.parse(localStorage.getItem('fuji-recipes') ?? '[]')

// Write
localStorage.setItem('fuji-recipes', JSON.stringify(recipes))
```

## Recipe Object Shape

```js
{
  id: 'uuid-v4-string',           // from crypto.randomUUID()
  name: 'My Velvia Street Look',
  createdAt: 1720000000000,        // Date.now() at save time
  sensorGeneration: 'xtrans-iv',
  filmSimId: 'classic-chrome',
  params: {
    highlightTone: 0,
    shadowTone: -1,
    color: 2,
    sharpness: 0,
    noiseReduction: -2,
    grainEffect: 'Weak',
    grainSize: 'Fine',
    colorChromeEffect: 'Strong',
    colorChromeBlue: 'Off',
  }
}
```

## Module: `js/utils/recipes.js`

Single interface for all recipe operations. The rest of the app never touches localStorage directly.

```js
export function loadRecipes()                          // returns Recipe[]
export function saveRecipe(recipe)                     // adds, returns saved Recipe with id+createdAt
export function updateRecipe(id, patch)                // merges patch into existing recipe
export function deleteRecipe(id)                       // removes by id
export function exportRecipe(id)                       // triggers .json file download
```

Each mutating function reads, modifies, and writes the full array atomically (no partial updates mid-array).

## Export Format

`exportRecipe` serializes a single recipe to a `.json` file and triggers a browser download via a temporary `<a href="blob:...">` element. The exported JSON matches the recipe object shape exactly.

## Recipe ID Generation

Use `crypto.randomUUID()` (available in all modern browsers). Never use `Math.random()`.

## Validation on Load

On `loadRecipes()`, validate that each entry has at minimum: `id` (string), `name` (string), `filmSimId` (string), `params` (object). Silently drop malformed entries and log a `console.warn`.

## Edge Cases

- **Storage full**: Catch `QuotaExceededError` on `setItem`. Show a visible error: "Storage full — delete some recipes first."
- **Empty name**: Default to `"Untitled Recipe"` if the user saves without entering a name.
- **Duplicate names**: Allowed — IDs are the canonical identifier.
