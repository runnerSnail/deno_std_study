import { serve } from "../http/serve";
import { compose } from './compose';
const exit = Deno.exit;
class Application {

    private _middlewares: Function[];
    private _server?: Server;
  
    constructor() {
      this._middlewares = [];
    }
  
    /**
     * 注册使用中间件
     * @param fn {Function}
     */
    public use(fn: Function): void {
      this._middlewares.push(fn);
    }
  
    /**
     * 开始监听服务
     * @param addr {string} 监听地址和端口 0.0.0.0:0000
     * @param fn {Function} 监听执行后的回调
     */
    public async listen(addr: string, fn?: Function) {
        const that = this;
        const server = new server(addr);
        for await (const req of s) {
            try {
                req.respond({ body: new TextEncoder().encode("Hello World\n") });
            } catch (error) {
                this._onError(error,req)
            }
            
        }
        // 启动HTTP服务
        if(fn && typeof fn === 'function'){
            fn();
        }
    }
  
    /**
     * 统一错误处理
     * @param err {Error} 错误对象
     * @param ctx {SafeContext} 当前HTTP上下文
     */
    private async _onError(err: Error, req: ServerRequest) {
      console.log(err);
      if (req instanceof ServerRequest) {
        req.respond({ body: new TextEncoder().encode(err.stack),status:500});
      } else {
        exit(1);
      }
    }
  }

export { Application };