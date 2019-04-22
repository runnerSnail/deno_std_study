import { Request, RequestReader } from "./../request/mod.ts";
import { Response, ResponseWriter } from "./../response/mod.ts";

/**
 * @class Conn context
 */
class Env {
  public req: Request;
  public res: Response; 

  public conn: Deno.Conn;

  constructor(conn: Deno.Conn) {
    this.conn = conn;
    this.req = new RequestReader(conn);
    this.res = new ResponseWriter(conn);
  }

  /**
   * Conn对话结束操作
   */
  close() {
    this.conn.close();
  }
}

// export { Env };