import { NavLink, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Deep Focus</div>
        <nav className="nav">
          <NavLink to="/tasks">Tasks</NavLink>
          <NavLink to="/tasks/new">New Task</NavLink>
          {/* Placeholders for future routes */}
          <NavLink to="#">Ideas</NavLink>
          <NavLink to="#">Reads</NavLink>
          <NavLink to="#">Watchlist</NavLink>
          <NavLink to="#">Goals</NavLink>
          <NavLink to="#">Investments</NavLink>
          <NavLink to="#">Feeds</NavLink>
          <NavLink to="#">Reports</NavLink>
          <NavLink to="#">Settings</NavLink>
        </nav>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
