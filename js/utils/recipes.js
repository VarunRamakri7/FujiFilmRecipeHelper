const KEY = 'fuji-recipes';

export function loadRecipes() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
      .filter(r => r?.id && r?.name && r?.filmSimId && r?.params);
  } catch {
    return [];
  }
}

function persist(recipes) {
  localStorage.setItem(KEY, JSON.stringify(recipes));
}

export function saveRecipe(recipe) {
  const saved = { ...recipe, id: crypto.randomUUID(), createdAt: Date.now() };
  persist([...loadRecipes(), saved]);
  return saved;
}

export function deleteRecipe(id) {
  persist(loadRecipes().filter(r => r.id !== id));
}

export function exportRecipe(id) {
  const recipe = loadRecipes().find(r => r.id === id);
  if (!recipe) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' }));
  a.download = `${recipe.name.replace(/\s+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
