"use client";

type ScrollLinkProps = {
  targetId: string;
  path: string;
  children: React.ReactNode;
  className?: string;
};

export function ScrollLink({ targetId, path, children, className }: ScrollLinkProps) {
  function scrollToTarget() {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", path);
  }

  return (
    <button className={className} type="button" onClick={scrollToTarget}>
      {children}
    </button>
  );
}
