"use client";

type Theme = "light" | "dark";

export default function ThemeToggle({
    theme,
    onChange,
    ariaLabel,
    lightLabel,
    darkLabel,
}: {
    theme: Theme;
    onChange: (theme: Theme) => void;
    ariaLabel: string;
    lightLabel: string;
    darkLabel: string;
}) {
    const isLight = theme === "light";

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={() => onChange(isLight ? "dark" : "light")}
            role="switch"
            aria-checked={!isLight}
            aria-label={ariaLabel}
        >
            <span className="theme-toggle-track">
                <span className={`theme-toggle-thumb ${isLight ? "light" : "dark"}`} aria-hidden="true">
                    <span className="theme-toggle-thumb-icon">{isLight ? "☀" : "☾"}</span>
                </span>
                <span className="theme-toggle-option" aria-hidden="true">
                    <span className={`theme-toggle-chip ${isLight ? "active" : ""}`}>{lightLabel}</span>
                    <span className={`theme-toggle-chip ${!isLight ? "active" : ""}`}>{darkLabel}</span>
                </span>
            </span>
        </button>
    );
}
