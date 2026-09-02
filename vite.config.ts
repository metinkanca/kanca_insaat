import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `npm run admin` starts Vite in `admin` mode, which is the only way the
// admin panel gets compiled in. `npm run dev` / `npm run build` produce the
// public site with all admin code stripped out.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    __ADMIN__: JSON.stringify(mode === 'admin'),
  },
}))
