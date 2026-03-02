import IPDashboard from "./components/IPDashboard";

export default function Home() {
    return (
        <>
            <div className="bg-orbs">
                <div className="orb" />
                <div className="orb" />
                <div className="orb" />
            </div>
            <div className="app-container">
                <header className="header">
                    <div className="header-badge">
                        <span className="dot" />
                        Live IP Intelligence
                    </div>
                    <h1>IP Insight</h1>
                    <p>
                        Premium IP geolocation lookup with real-time security analysis,
                        network intelligence, and interactive mapping.
                    </p>
                </header>
                <IPDashboard />
                <footer className="footer">
                    <p>
                        Powered by{" "}
                        <a
                            href="https://ipinfo.dkly.net"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            dklyIPdatabase
                        </a>{" "}
                        · Built with vinext on Cloudflare Workers
                    </p>
                </footer>
            </div>
        </>
    );
}
