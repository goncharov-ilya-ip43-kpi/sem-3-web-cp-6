import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'src/',
    
    build: {
        rollupOptions: {
      	    input: {
                index: resolve(__dirname, 'src/index.html'),
        	images: resolve(__dirname, 'src/images.html'),
      	    },
    	},
        outDir: '../dist',
        emptyOutDir: true
    }
});
