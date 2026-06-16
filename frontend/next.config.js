// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:8000",
  },
};
module.exports = nextConfig;
// frontend/next.config.js
