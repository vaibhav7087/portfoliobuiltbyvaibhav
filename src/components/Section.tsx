import type { ReactNode } from "react";

export function Section({
  id,
  index,
  title,
  children,
}: {
  id?: string;
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="section" id={id}>
      <div className="container">
        <p className="section-label mono">
          <i>{index}</i> {title}
        </p>
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}
