import {mkdir,copyFile} from 'node:fs/promises';
await mkdir(new URL('../dist/nodes/OmniDome/',import.meta.url),{recursive:true});
await copyFile(new URL('../nodes/OmniDome/omnidome.svg',import.meta.url),new URL('../dist/nodes/OmniDome/omnidome.svg',import.meta.url));
