import { createApp } from './app.js';
const app=await createApp();
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await app.close();process.exit(0);});
await app.listen({port:Number(process.env.PORT||3001),host:process.env.HOST||'0.0.0.0'});
