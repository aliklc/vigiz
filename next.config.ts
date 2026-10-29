import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// Telefondan yerel ağ IP'siyle dev sunucusuna girebilmek için
	allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
};

export default nextConfig;
