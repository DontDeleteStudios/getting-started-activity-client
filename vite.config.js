import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  	envDir: '../',
  	server: {
		proxy: {
			'/api': {
				target: 'https://getting-started-activity-server-7e0q9tveg.vercel.app:3001',
				changeOrigin: true,
				secure: false,
				ws: true,
			},
		},
		hmr: {
			clientPort: 443,
		},
  	},
});
