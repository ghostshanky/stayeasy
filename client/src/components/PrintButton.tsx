import React from "react";

export default function PrintButton({ className = "" }: { className?: string }) {
  const handlePrint = () => {
    try {
      // Add a temporary class to body for print-mode CSS if needed
      document.body.classList.add("print-mode");
      // allow CSS to render
      setTimeout(() => {
        window.print();
        // cleanup after print dialog closes (best-effort)
        document.body.classList.remove("print-mode");
      }, 120);
    } catch (e) {
      console.error("Print failed", e);
    }
  };

  return (
    <button
      className={`print-button ${className}`}
      onClick={handlePrint}
      aria-label="Print page"
      title="Print"
      type="button"
    >
      Print
    </button>
  );
}