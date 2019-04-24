## http-compose

> Depending on deno_std

## useinfo

````typescript
const app = new Application();
app.use(async (req, next) => {
    console.log(1);
    await next();
    console.log(4);
    req.respond({ body: new TextEncoder().encode("Hello World\n") });
})

app.use(async (req, next) => {
    console.log(2);
    await next();
    console.log(3);
})
app.listen('127.0.0.1:8000', () => {
    console.log(`启动：127.0.0.1:8000`)
})```
````
