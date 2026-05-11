import handler from "./dist/server/index.js";

const ALLOWED_ENV_VARS = ["IPINFO_API_KEY"];

export default {
    async fetch(request, env, ctx) {
        // Only copy allowlisted env vars to process.env for API key access
        if (env) {
            for (const key of ALLOWED_ENV_VARS) {
                if (typeof env[key] === "string") {
                    process.env[key] = env[key];
                }
            }
        }
        return handler(request, env, ctx);
    },
};
