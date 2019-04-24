import Onion from './onion.ts';
import { test } from "../dev_deps.ts";
import { assert, assertEquals } from "../dev_deps.ts";
// assert(false, '存在')
const { run } = Deno;

let httpComposeServer;
async function startHttpComposeServer(): Promise<void> {
    httpComposeServer = run({
        args: [
            "deno",
            "--allow-read",
            "--allow-net",
            "http_compose/start_onion_server.ts",
            ".",
            "--cors"
        ],
        stdout: "piped"
    });
}
function killHttpComposeServer(): void {
    httpComposeServer.close();
    httpComposeServer.stdout.close();
}
test(async function testOnion() {
    await startHttpComposeServer();
    try {
        const res = await fetch("127.0.0.1:8000");
        assertEquals(res, "1,2,3,4");
    } finally {
        killHttpComposeServer();
    }
})
console.log('测试通过')