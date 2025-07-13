import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ["src/**/*"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.stories.tsx",
      ],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ReactSciText",
      formats: ["es", "umd"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-katex",
        "katex",
        "react-markdown",
        "remark-gfm",
        "smiles-drawer",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-katex": "ReactKatex",
          katex: "katex",
          "react-markdown": "ReactMarkdown",
          "remark-gfm": "remarkGfm",
          "smiles-drawer": "SmilesDrawer",
        },
      },
    },
  },
});
