/** @type {import('next').NextConfig} */
const secure = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=()' },
];

module.exports = {
  async headers() {
    return [
      { source: '/(.*)', headers: secure },
      { source: '/api/(.*)', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
    ];
  },
};
