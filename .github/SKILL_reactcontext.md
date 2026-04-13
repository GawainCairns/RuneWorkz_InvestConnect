---
name: react-context
description: Define a consistent pattern for managing application data using React Context, including fetching, filtering, relationships, and mutations.
argument-hint: context
user-invocable: true
disable-model-invocation: false
---
# Skill Instructions

## Core Principles

1. **Single Source of Truth**
   - All data must be stored in context state.
   - Components must not fetch or own data independently.

2. **Collections Pattern**
   - Data is always stored as arrays:
     ```
     const [teams, setTeams] = useState<Team[]>([])
     ```
   - Naming:
     - `<itemName>` → collection
     - `<setItemName>` → setter

3. **Active Item Pattern**
    - Track selected item via `<itemName>Id`
       ```
       const [teamId, setTeamId] = useState<number | null>(null)
       ```
    - When the `<itemName>Id` is set the context (and any convenience hook) MUST expose an `active<itemName>` that is derived from the collection.
       - `active<itemName>` is chosen from the in-memory collection using the id (no extra fetch).
       - If the id doesn't match an item, `active<itemName>` should be `null`.

       Example (Team context/provider + hook):
       ```tsx
       // teamContext.tsx
       import React, { createContext, useContext, useMemo, useState } from 'react'
       import { Team } from './types'

       type TeamContextValue = {
          teams: Team[]
          setTeams: (t: Team[]) => void
          teamId: number | null
          setTeamId: (id: number | null) => void
          activeTeam: Team | null
       }

       const TeamContext = createContext<TeamContextValue | undefined>(undefined)

       export const TeamProvider: React.FC = ({ children }) => {
          const [teams, setTeams] = useState<Team[]>([])
          const [teamId, setTeamId] = useState<number | null>(null)

          const activeTeam = useMemo(() => {
             return teamId == null ? null : teams.find(t => t.id === teamId) ?? null
          }, [teams, teamId])

          const value: TeamContextValue = { teams, setTeams, teamId, setTeamId, activeTeam }

          return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
       }

       // useTeam.ts
       import { useContext } from 'react'

       export function useTeam() {
          const ctx = useContext(TeamContext)
          if (!ctx) throw new Error('useTeam must be used within TeamProvider')
          return ctx
       }
       ```

       - Usage: components should call `const { teamId, setTeamId, activeTeam } = useTeam()`.
       - Setting `setTeamId(id)` will update `activeTeam` from the existing `teams` collection.

4. **Child Collection Fetching**
   - Active ID changes ONLY trigger child collection fetching.
   - Must NOT trigger parent refetch.

5. **User Dependency**
   - Parent collections may depend on authenticated user:
     ```
     const { user } = useAuth()
     ```

---

## Data Fetching

6. **Service Layer**
   - All API calls must live in service files.
   - No direct fetch calls in context.

7. **Environment-Based URLs**
   - All API endpoints must use `.env` variables:
     ```
     const baseUrl = process.env.REACT_APP_TEAM_API_URL
     ```

8. **Typed APIs**
   - No usage of `any`.
   - All inputs/outputs must be typed.

9. **Update Endpoint Rule**
   - PUT and PATCH share the same endpoint for updates.

---

## Filtering & Sorting

10. **Default Behaviour**
   - Filtering is **in-memory by default**.
   - Can optionally trigger refetch based on user instruction.

11. **Default Filter Fields**
   - Always filter on:
     - `name`
     - `description` (if present)

12. **Filter State**
   ```
   const [filters, setFilters] = useState<{ search: string }>({ search: '' })
   ```

13. **In-Memory Filtering Rule**
   ```
   const filteredTeams = teams.filter(t =>
     t.name.toLowerCase().includes(filters.search.toLowerCase()) ||
     (t.description?.toLowerCase().includes(filters.search.toLowerCase()) ?? false)
   )
   ```

---

## Mutations

14. **Supported Mutations**
   - `create<Item>`
   - `update<Item>`
   - `delete<Item>`

15. **Mutation Rules**
   - Must call service function
   - Must mutate in-memory collection
   - Must NOT refetch data

---

## File Structure

- `types.ts`
- `teamService.ts`
- `teamContext.tsx`
- `useTeam.ts` (optional)

All file names must be **camelCase**.

---

## Behavioral Rules

- Parent collection:
  - fetch on mount or user change
- Child collection:
  - fetch ONLY on active ID change
- Filtering:
  - default in-memory
  - optional API-driven (user-defined)
- Mutations:
  - update in-memory only
  - no refetch
- Services:
  - required for all API calls
- Types:
  - must always be explicitly defined

---

## Anti-Patterns

- Using `any`
- Fetching inside components
- Refetching after mutations
- Triggering parent fetch on active ID change
- Hardcoding API URLs
