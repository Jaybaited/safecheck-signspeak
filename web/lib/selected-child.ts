// The child a parent is currently viewing (saved in this browser, per parent).
const KEY_PREFIX = 'parent_selected_child_';

export function pickChild<T extends { id: string }>(parentId: string, children: T[]): T | undefined {
  if (typeof window === 'undefined') return children[0];
  const saved = localStorage.getItem(KEY_PREFIX + parentId);
  return children.find((c) => c.id === saved) ?? children[0];
}