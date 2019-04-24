import Onion from './onion.ts';
let data: number[] = [];
const app = new Onion();
app.use(async (req, next) => {
    data.push(1);
    await next();
    data.push(4);
    req.respond({ body: new TextEncoder().encode(`${data.toString()}`) });
})

app.use(async (req, next) => {
    data.push(2);
    await next();
    data.push(3);
})
app.listen('127.0.0.1:8000')