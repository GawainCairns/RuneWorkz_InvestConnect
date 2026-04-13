---
name: react-page-routing
description: Defines a minimal, explicit routing system using React Router with inline `ProtectedRoute` wrapping. Pages handle their own layout and data via context.
argument-hint: routing
user-invocable: true
disable-model-invocation: false
---
# Skill Instructions# spa-routing-simple

## Core Pattern

```tsx
<Routes>
  <Route path="/teams" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
  <Route path="/teams/:id" element={<ProtectedRoute><TeamDetailPage /></ProtectedRoute>} />
</Routes>
```

---

## ProtectedRoute Props

```ts
type ProtectedRouteProps = {
  children: React.ReactNode;
  role?: string | string[];
  permission?: string | string[];
};
```

---

## Rules

- Not logged in → redirect `/login`
- Role: must match at least one
- Permission: must match at least one
- Role + Permission: must satisfy both
- None provided: only authentication required

---

## Example Routes

```tsx
<Routes>
  <Route
    path="/teams"
    element={
      <ProtectedRoute>
        <TeamPage />
      </ProtectedRoute>
    }
  />

  <Route
    path="/teams/:id"
    element={
      <ProtectedRoute>
        <TeamDetailPage />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin"
    element={
      <ProtectedRoute role="admin">
        <AdminPage />
      </ProtectedRoute>
    }
  />

  <Route path="/login" element={<LoginPage />} />
</Routes>
```

---

## Collection → Detail Pattern

### Flow
1. Load collection from context
2. Click item
3. Set active ID
4. Navigate to detail route
5. Detail reads active item

---

## Collection Page

```tsx
const TeamPage = () => {
  const { items, setActiveItemId } = useTeamContext();
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <main>
        {items.map((team) => (
          <div
            key={team.id}
            onClick={() => {
              setActiveItemId(team.id);
              navigate(`/teams/${team.id}`);
            }}
          >
            {team.name}
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
};
```

---

## Detail Page

```tsx
const TeamDetailPage = () => {
  const { activeItem } = useTeamContext();

  if (!activeItem) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <main>
        <h1>{activeItem.name}</h1>
      </main>
      <Footer />
    </>
  );
};
```

---

## Deep Linking

```tsx
const TeamDetailPage = () => {
  const { activeItem, setActiveItemId } = useTeamContext();
  const { id } = useParams();

  useEffect(() => {
    if (!activeItem && id) {
      setActiveItemId(id);
    }
  }, [id]);

  if (!activeItem) return <div>Loading...</div>;

  return <div>{activeItem.name}</div>;
};
```

---

## Summary

- Explicit routing
- Inline protection
- Context-driven data
- No layout abstraction
