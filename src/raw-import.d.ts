/** vite: `import text from './file?raw'` gives the file's content as a string (used by specs that read repo files) */
declare module '*?raw' {
  const content: string;
  export default content;
}
