"use client";

import { useState, useEffect, useRef } from "react";
import { type Locale, LOCALES, detectLocale } from "../i18n/translations";

export default function LanguageSelector({
    locale,
    onChange,
}: {
    locale: Locale;
    onChange: (locale: Locale) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleSelect = (code: Locale) => {
        onChange(code);
        localStorage.setItem("ip-insight-locale", code);
        setOpen(false);
    };

    return (
        <div className="lang-selector" ref={ref}>
            <button
                className="lang-trigger"
                onClick={() => setOpen(!open)}
                aria-label="Select language"
                id="lang-selector-btn"
            >
                <span className="lang-flag">{current.flag}</span>
                <span className="lang-label">{current.label}</span>
                <span className={`lang-arrow ${open ? "open" : ""}`}>▾</span>
            </button>
            {open && (
                <div className="lang-dropdown">
                    {LOCALES.map((l) => (
                        <button
                            key={l.code}
                            className={`lang-option ${l.code === locale ? "active" : ""}`}
                            onClick={() => handleSelect(l.code)}
                        >
                            <span className="lang-flag">{l.flag}</span>
                            <span>{l.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
