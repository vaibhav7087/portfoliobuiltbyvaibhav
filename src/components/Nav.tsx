import Link from "next/link";
import { profile } from "@/data/profile";

const links = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#achievements", label: "Achievements" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="nav-logo mono" aria-label="Home">
          vaibhav<span>@</span>bylance ~ $
        </Link>
        <nav className="nav-links" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
          <a className="nav-resume mono" href={profile.resumePath} download>
            ./resume.pdf
          </a>
        </nav>
      </div>
    </header>
  );
}
