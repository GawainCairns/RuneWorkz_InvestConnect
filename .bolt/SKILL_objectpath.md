---
name: object-path
description: Render and manage user data using object paths to create a virtual folder navigation system.
argument-hint: object path
user-invocable: true
disable-model-invocation: false
---

# Object Path Frontend Skill

Purpose

This skill describes how the frontend should interpret `object_path` values to provide a virtual filesystem experience from a flat list of items. Use this skill when you need tree navigation, folder views, or card/grid displays derived from `object_path` values.

Overview

The frontend receives a flat list of items and builds:

- Tree navigation
- Folder views
- Card/grid displays

It does not need to know about backend database table names (for example `diagram_user`)—treat `object_path` as an opaque hierarchical string.

Input Data

Example API response:

```json
[
  { "id": 1, "name": "A", "object_path": "projects/alpha" },
  { "id": 2, "name": "B", "object_path": "projects/alpha" },
  { "id": 3, "name": "C", "object_path": "projects/beta" }
]
```

Core Responsibilities

1. Build Virtual Tree
   - Split `object_path` by `/` and construct a nested structure dynamically.

2. Track Current Path
   - Example React state:

```js
const [currentPath, setCurrentPath] = useState("")
```

   - `""` → root
   - `"projects/alpha"` → inside a folder

3. Display Modes
   - Tree View: expand/collapse folders and show hierarchy.
   - Card/List View: show child folders (derived) and items in the current path.

4. Derive Folders
   - From paths like `projects/alpha/a`, `projects/alpha/b`, `projects/beta/c` derive top-level folders:
     - `projects` → `alpha`, `beta`

5. Filtering Logic
   - Items in current folder: `item.object_path === currentPath`
   - Child folders: `item.object_path.startsWith(currentPath + "/")`
   - Extract only the next segment when deriving child folder names (see utilities below).

6. Navigation
   - Clicking a folder → `setCurrentPath(newPath)`
   - Breadcrumbs: derive segments from `currentPath` (e.g., `projects > alpha`).

7. Move Items
   - Update an item's path and send to API:

```js
updateItem(id, { object_path: "projects/beta" })
```

8. Move Folders
   - Trigger a backend bulk move operation:

```js
moveFolder("projects/alpha", "projects/beta")
```

9. Create Item
   - Use `currentPath` for new items:

```js
createItem({ object_path: currentPath, name: "New" })
```

Utilities

Normalize Path

```js
function normalize(path) {
  return (path || "")
    .replace(/\/+/g, "/")
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .toLowerCase()
}
```

Get Segments

```js
function getSegments(path) {
  const p = normalize(path)
  return p === "" ? [] : p.split("/")
}
```

Get Child Folders (derive next-level folder names)

```js
function getChildFolders(items, currentPath) {
  const base = normalize(currentPath)
  const seen = new Set()
  const next = []

  items.forEach(item => {
    const p = normalize(item.object_path)
    if (base === "") {
      // top-level candidates
      const segs = p.split("/")
      if (segs.length > 0 && segs[0]) seen.add(segs[0])
    } else if (p.startsWith(base + "/")) {
      const remainder = p.slice(base.length + 1)
      const seg = remainder.split("/")[0]
      if (seg) seen.add(seg)
    }
  })

  Array.from(seen).sort().forEach(s => next.push(s))
  return next
}
```

Filter Items In Current Folder

```js
function itemsInCurrent(items, currentPath) {
  const base = normalize(currentPath)
  return items.filter(i => normalize(i.object_path) === base)
}
```

React Example (outline)

```js
function ObjectPathBrowser({ items, api }) {
  const [currentPath, setCurrentPath] = useState("")

  const folders = useMemo(() => getChildFolders(items, currentPath), [items, currentPath])
  const visibleItems = useMemo(() => itemsInCurrent(items, currentPath), [items, currentPath])

  return (
    <div className="object-path-browser">
      <Breadcrumbs path={currentPath} onNavigate={setCurrentPath} />
      <div className="layout">
        <TreeView items={items} currentPath={currentPath} onNavigate={setCurrentPath} />
        <main>
          <FolderList folders={folders} onOpen={p => setCurrentPath((currentPath ? currentPath + "/" : "") + p)} />
          <CardGrid items={visibleItems} onMove={api.updateItem} />
        </main>
      </div>
    </div>
  )
}
```

API Notes

- `updateItem(id, { object_path })` — update single item path.
- `moveFolder(fromPath, toPath)` — backend should perform bulk updates and return updated items.
- `createItem({ object_path, ... })` — create new item under `currentPath`.

UX Considerations

- Allow free typing of paths with validation and normalization.
- Provide autocomplete suggestions from derived folders and item names.
- Support drag-and-drop for moving items and folders (invoke `updateItem` or `moveFolder`).
- Show empty folders (derived or cached) — keep a small cache of seen folder paths.
- Handle large datasets with lazy loading and virtualization; compute child folders server-side for extremely large sets.

Notes

- Keep frontend logic stateless relative to backend schema — treat `object_path` as opaque strings that map to a virtual hierarchy.
- Offer helpers for serializing and normalizing paths so components stay consistent.
