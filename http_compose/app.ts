import { serve } from "https://deno.land/std/http/server.ts";
const s = serve("127.0.0.1:8000");
// let middle = []
async function main() {
    for await (const req of s) {
        
        console.log(s);
        console.log(req);
        console.log(req.headers.get('cookie'));
        req.respond({ body: new TextEncoder().encode("Hello World\n") });
    }
}

main();