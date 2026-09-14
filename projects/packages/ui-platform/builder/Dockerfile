FROM node:22-alpine
WORKDIR /opt/builder
RUN npm init -y && npm install --save-exact monaco-editor@0.52.2 esbuild@0.25.12 typescript@5.9.3 postcss@8.5.6 tailwind-merge@3.3.1 react@19.2.0 react-dom@19.2.0 react-router-dom@7.13.1 @tailwindcss/node@4.2.1 @tailwindcss/oxide@4.2.1 tailwindcss@4.2.1 @types/react@19.2.0 @types/react-dom@19.2.0
RUN printf "export { twMerge } from 'tailwind-merge';\n" > /opt/builder/ui-helpers.ts
COPY editor ./editor
RUN node editor/build-support.mjs
COPY worker.mjs renderer.mjs ./
CMD ["node", "/opt/builder/worker.mjs"]
