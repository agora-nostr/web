import{A as r,B as o}from"./AsQG98fS.js";const t="ndk";function s(e){if(e)return e;try{if(r(t)){const n=o(t);if(n)return n}}catch{}throw new Error(`NDK not found. Either:
1. Provide as second parameter: createBuilder(() => config, ndk)
2. Set in Svelte context: setContext('${t}', ndk)`)}export{s as r};
