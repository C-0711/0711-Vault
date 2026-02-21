// V-10: Mobile-Responsive UI Components
import React from "react";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveContainer({ children, className = "" }: ResponsiveContainerProps) {
  return (
    <div className={`w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl ${className}`}>
      {children}
    </div>
  );
}

export function ResponsiveGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3 },
  gap = 4,
  className = ""
}: {
  children: React.ReactNode;
  cols?: { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${cols.sm || 1} md:grid-cols-${cols.md || 2} lg:grid-cols-${cols.lg || 3} gap-${gap} ${className}`}>
      {children}
    </div>
  );
}

export function MobileMenu({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode; }) {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 z-50 lg:hidden">
        <div className="p-4">
          <button onClick={onClose} className="absolute top-4 right-4 p-2">×</button>
          {children}
        </div>
      </div>
    </>
  );
}

export function useBreakpoint() {
  const [bp, setBp] = React.useState<"sm"|"md"|"lg"|"xl">("lg");
  React.useEffect(() => {
    const handle = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? "sm" : w < 768 ? "md" : w < 1024 ? "lg" : "xl");
    };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return { breakpoint: bp, isMobile: bp === "sm", isDesktop: bp === "lg" || bp === "xl" };
}
