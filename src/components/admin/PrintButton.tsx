"use client";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export default function PrintButton({ className, children }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.print()}
    >
      {children}
    </button>
  );
}
