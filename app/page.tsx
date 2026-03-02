"use client";

import { useState, useEffect } from "react";
import IPDashboard from "./components/IPDashboard";
import LanguageSelector from "./components/LanguageSelector";
import { type Locale, detectLocale, t } from "./i18n/translations";

export default function Home() {
    const [locale, setLocale] = useState<Locale>("en");

    useEffect(() => {
        setLocale(detectLocale());
    }, []);

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
                        <LanguageSelector locale={locale} onChange={setLocale} />
                    </div>
                    <h1>{t(locale, "header.title")}</h1>
                    <p>{t(locale, "header.desc")}</p>
                </header>
                <IPDashboard locale={locale} />
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
