import type { SessionUser } from "@/components/auth/session";
import { PasskeyEnrollButton } from "@/components/auth/passkey-enroll-button";

const baseNav = ["Dashboard", "DCS", "Customers", "Loans", "Payments", "Messages"];
const ownerNav = ["Reports", "Settings", "Admin"];

type SidebarProps = {
  user: SessionUser;
  onSignOut: () => void;
};

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const navItems = user.role === "owner" ? [...baseNav, ...ownerNav] : baseNav;

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brandBlock">
        <div className="brandMark" aria-hidden="true">
          LM
        </div>
        <div>
          <p className="eyebrow">Private PWA</p>
          <h1>Loan Manager</h1>
        </div>
      </div>
      <nav className="navList">
        {navItems.map((item) => (
          <a key={item} href={`#${item.toLowerCase()}`} className={item === "Dashboard" ? "active" : ""}>
            {item}
          </a>
        ))}
      </nav>
      <div className="userPanel">
        <span className="rolePill">{user.role}</span>
        <strong>{user.name}</strong>
        <small>{user.email}</small>
        <PasskeyEnrollButton />
        <button type="button" className="secondaryButton" onClick={onSignOut}>
          Sign out
        </button>
      </div>
      <div className="syncPanel">
        <span className="statusDot" />
        Ready for PWA install
      </div>
    </aside>
  );
}
