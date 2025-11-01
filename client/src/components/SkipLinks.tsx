/**
 * Skip Links Component
 * Allows keyboard users to skip to main content areas
 * WCAG 2.1 Level A requirement
 */
export default function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
    </div>
  );
}
