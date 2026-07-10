"use client";

type ScrollLinkProps = {
  targetId: string;
  children: React.ReactNode;
  className?: string;
};

export function ScrollLink({ targetId, children, className }: ScrollLinkProps) {
  function scrollToTarget() {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", window.location.pathname);
  }

  return (
    <button className={className} type="button" onClick={scrollToTarget}>
      {children}
    </button>
  );
}
