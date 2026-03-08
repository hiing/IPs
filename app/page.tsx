"use client";

import { useState, useEffect } from "react";
import IPDashboard from "./components/IPDashboard";
import LanguageSelector from "./components/LanguageSelector";
import ThemeToggle from "./components/ThemeToggle";
import { type Locale, detectLocale, t } from "./i18n/translations";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "ip-insight-theme";

function isTheme(value: string | null): value is Theme {
    return value === "light" || value === "dark";
}

export default function Home() {
    const [locale, setLocale] = useState<Locale>("en");
    const [theme, setTheme] = useState<Theme>("light");

    useEffect(() => {
        setLocale(detectLocale());

        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        const nextTheme: Theme = isTheme(savedTheme) ? savedTheme : "light";

        setTheme(nextTheme);
        document.documentElement.dataset.theme = nextTheme;
    }, []);

    const handleThemeChange = (nextTheme: Theme) => {
        setTheme(nextTheme);
        document.documentElement.dataset.theme = nextTheme;
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    };

    return (
        <>
            <div className="bg-orbs">
                <div className="orb" />
                <div className="orb" />
                <div className="orb" />
            </div>
            <div className="app-container">
                <header className="header">
                    <div className="header-top-row">
                        <div className="header-badge">
                            <span className="dot" />
                            {t(locale, "header.badge")}
                        </div>
                        <div className="header-controls">
                            <ThemeToggle
                                theme={theme}
                                onChange={handleThemeChange}
                                ariaLabel={t(locale, "theme.toggle")}
                                lightLabel={t(locale, "theme.light")}
                                darkLabel={t(locale, "theme.dark")}
                            />
                            <LanguageSelector locale={locale} onChange={setLocale} />
                        </div>
                    </div>
                    <h1>{t(locale, "header.title")}</h1>
                    <p>{t(locale, "header.desc")}</p>
                </header>
                <IPDashboard locale={locale} theme={theme} />
                <footer className="footer">
                    <p>
                        {t(locale, "footer.poweredBy")}{" "}
                        <a
                            href="https://ipinfo.dkly.net"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            dklyIPdatabase
                        </a>{" "}
                        · {t(locale, "footer.builtWith")}
                    </p>
                </footer>
            </div>
        </>
    );
}
