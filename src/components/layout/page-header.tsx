import type { ReactNode } from "react";
import Link from "next/link";
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";

export function PageHeader({
  title,
  description,
  actions,
  stats,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  stats?: Array<{ label: string; value: ReactNode; hint?: string; href?: string }>;
}) {
  return (
    <>
      <AppBreadcrumb />
      <div className="paper-page-head">
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="paper-page-actions">{actions}</div> : null}
      </div>
      {stats?.length ? (
        <div className="paper-summary-strip">
          {stats.map((s) => {
            const body = <>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
              {s.hint ? <small>{s.hint}</small> : null}
            </>;
            return s.href
              ? <Link className="paper-summary-item paper-summary-link" href={s.href} key={s.label}>{body}</Link>
              : <div className="paper-summary-item" key={s.label}>{body}</div>;
          })}
        </div>
      ) : null}
    </>
  );
}
