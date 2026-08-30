import Link from "next/link";

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="container">
        <div className="notfound-box mono">
          <p className="notfound-cmd">
            <span>$</span> curl builtbyvaibhav.bylance.in/&lt;path&gt;
          </p>
          <p className="notfound-err">command not found (404)</p>
          <p>
            <Link href="/" className="link-arrow">
              $ cd ~
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
