import handler from "./dist/server/index.js";

export default {
    async fetch(request, env, ctx) {
        // Pass env to process.env for API key access
        if (env) {
            for (const [key, value] of Object.entries(env)) {
                if (typeof value === "string") {
                    process.env[key] = value;
                }
            }
        }
        return handler(request, env, ctx);
    },
};
