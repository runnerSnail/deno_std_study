[toc]
# Deno如何实现Mysql中间件
> 其他语言类似，换汤不换药

## 首先讲解一下mysql协议

想要编写mysql中间件，必须需要对mysql协议有所了解。mysql协议中间件。接下来会简单讲解一些基本协议，如果您想仔细了解，请您移步官方文档[mysql protocol](https://dev.mysql.com/doc/internals/en/client-server-protocol.html "mysql protocol")

### mysql 协议了解
#### 简介
mysql采用C/S模式，服务器启动后会监听本地端口。客户端请求到达时，会执行三段握手以及mysql的权限认证，验证成功后会客服端会发送请求报文，服务端发送响应报文进行交互

##### C->S
```
graph LR
Client-->Server
```

存在以下数据包

- 登陆时的auth包
- 执行SQL的CMD包

##### S->C
```
graph LR
Server-->Client
```

存在以下数据包

- 握手包
- 数据包
- 数据流结束包
- 成功包（OK Packet）
- 错误信息包

### 如何与MySql建立连接

所有客户端链接都需要和经过server认证

验证分为4个步骤
####  1、三次握手建立tcp连接
> 客服端拨号进行链接

```Typescript
    // 伪代码
    public async connect(){
        this.conn = Deno.dail({
            hostname,
            port,
            transport:"tcp"
        })
    }
```
####  2、建立mysql连接，也就是认证阶段

> 认证阶段 Initial Handshake 
1. 服务器按照 [Protocol::HandshakeV10](https://dev.mysql.com/doc/internals/en/connection-phase-packets.html#packet-Protocol::HandshakeV10)协议发送给客服端
2. 客户端根据协议内容进行内容修改然后[Protocol::HandshakeResponse](https://dev.mysql.com/doc/internals/en/connection-phase-packets.html#packet-Protocol::HandshakeResponse)提交服务端进行验证

下面这个图更直观
![Protocol::HandshakeV10 协议直观图](https://denoer-1255609850.cos.ap-chengdu.myqcloud.com/640.jpeg)

密码验证图-盗用
![image](https://denoer-1255609850.cos.ap-chengdu.myqcloud.com/temp/image_1ciquhe0510k4fkcj0g80l16vi9.png)

```typescript
// **** 验证流程 ****
// 1、mysql.user中存储的是两次sha1加密过后的stage2hash 
// 2、服务端发送随机字符串scramble到客服端并且mysqld利用stage2hash+scramble进行一次sha1操作，生成key。
// 3、客户端利用用户输入pwd生成stage2hash，加上mysqld发送过来的scramble进行一次sha1操作，生成和mysqld相同的key。然后再拿这个key和stage1hash进行一次xor操作，生成ciphertext，发送给mysqld
// 4、mysqld拿到客户端发送的ciphertext，加上之前生成的key，进行一次xor逆向操作，解密出stage1hash，再对stage1hash进行一次sha1操作，生成stage2hash，再拿着这个stage2hash和mysql.user表中存储的信息对比，如果一致，则此次密码认证通过。


export function authPwd(password:string,scramble:Unit8Array){
    // 客服发送验证信息
    const hash = new Hash("sha1");
    const pwdDigestOnce = hash.digest(encode(password)).data;
    const pwdDigestTwice = hash.digest(pwd1).data;
    let scrambleAndPwdDigest = new Unit8Array(seed.length + pwdDigestTwice.length);
    scrambleAndPwdDigest.set(scramble);
    scrambleAndPwdDigest.set(pwdDigestTwice, scramble.length);
    scrambleAndPwdDigest = hash.digest(scrambleAndPwdDigest).data;
    const ciphertext = scrambleAndPwdDigest.map((byte, index) => {
        // key和stage1hash进行一次xor操作
        return byte ^ pwdDigestOnce[index];
    });

    return ciphertext;
}


```

3. 服务端返回验证结果

####  3、认证通过之后，客户端开始于服务端进行交互，也就是命令执行阶段

```typescript
    // receive = await this.packet(); 等待服务端验证结果
    // 通过是OK packet Err packet 返回验证结果
    if (header === 0xff) {
      const error = parseError(receive.body, this);
      log.error(`connect error(${error.code}): ${error.message}`);
      this.close();
      throw new Error(error.message);
    } 
    // 链接成功
```


####  4、断开mysql连接
> 客服端发出退出命令包
    四次握手断开tcp连接 只需 this.conn.close()

### 如何维护一个连接池


```typescript
// promise 经典defer操作 
interface Defered<T>{
    promise:promise<T>;
    reslove:(c?:T)=>void;
    reject:(e?:any)=>void;
}

export function defer<T>():Defer<T>{
    let reject: (arg?: any) => void;
    let resolve: (arg?: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {
        promise,
        reject,
        resolve
    };
}

const connection = await this.pool.getConnection(); 

async getConnection(): Promise<T> {
    // 如果存在可用已经建立的conn直接取出来用
    if (this.availableConn.length) {
      return this.availableConn.pop();
    } else if (this._size < this.poolSize) {
    // 没有可用conn如果创建新的conn直至最大
      this._size++;
      const item = await this.create();
      return item;
    }
    // 没有可用conn，且已经达到最大链接数量 等待
    const d = defer<T>();
    this._queue.push(d);
    await d.promise;
    return this.availableConn.pop();
}

// 使用完毕归还
async returnConnection(item: T) {
    this.availableConn.push(item);
    if (this._queue.length) {
      this._queue.shift().resolve();
    }
}

```

### 如何增删改查 - part 2
> 避免篇幅较长，下次继续讲解。原理与建立连接不变，按照协议格式进行curd

## 总结

编写mysql中间件的难点是 需要分析协议，按照协议进行无脑式编写。
其中连程池的需要借助promise实现协程是一个难点。


## 思考

mysql中间件目前利用js编写，替换成rust编写ffi是否能提高性能。

感觉可以 【故作思考.jpg】

待我继续学习学习rust

