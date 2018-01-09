/**
 * 内容脚本同时也是一个 Server 端，用来执行扩展程序发送过来的命令
 */

import {Server} from 'connect.io';
import st from './st';

const server = new Server();

/* istanbul ignore next */
/**
 * 将自己的 location 对象报告给后台
 * @param data
 * @param {Function} resolve
 */

// 就是nginx的location
//  window.location 对象用于获得当前页面的地址 (URL)，并把浏览器重定向到新的页面。
// Window Location
// window.location 对象在编写时可不使用 window 这个前缀。
// 一些例子：
// location.hostname 返回 web 主机的域名
// location.pathname 返回当前页面的路径和文件名
// location.port 返回 web 主机的端口 （80 或 443）
// location.protocol 返回所使用的 web 协议（http:// 或 https://）

export function onGetLocation( data , resolve ) {
  if ( self === top ) {
    resolve( JSON.parse( JSON.stringify( location ) ) );
  }
}
// JSON.stringify() 方法将一个  JavaScript 值转换为一个 JSON 字符串，如果指定了一个 replacer 函数，则可以替换值，或者如果指定了一个 replacer 数组，可选地仅包括指定的属性。
// resolve是什么 promise的吗



// window.self


// 功能：是对当前窗口自身的引用。它和window属性是等价的。

// 语法：window.self

// 注：window、self、window.self是等价的。

 

// window.top

// 功能：返回顶层窗口，即浏览器窗口。

// 语法：window.top

// 注：如果窗口本身就是顶层窗口，top属性返回的是对自身的引用。

/**
 * 接收到翻译命令时，翻译网页上的拖蓝
 */
export function onTranslate() {
  st.query.text = getSelection().toString();
  st.safeTranslate();
}

/* istanbul ignore if */
// process.env 是读取系统环境变量的，比如你在启动服务的时候，设置环境变量为production或者development，那么在程序里面就可以通过process.env.ENVNAME获取，因为你在node命令窗口启动时没有设置相关的环境变量，所以就没办法获取到了，你可以试一下NODE_ENV=development node来启动命令窗口，然后应该就可以获取到了！
if ( process.env.NODE_ENV !== 'testing' ) {
  server.on( 'connect' , ( client )=> {
    client.on( 'get location' , onGetLocation );
    client.on( 'translate' , onTranslate );
  } );
}

export default server;
// 现在你应该找到要点了 - 如果你想要你的模块成为一个特别的对象类型，那么使用module.exports；如果你希望你的模块成为一个传统的模块实例（module instance），使用exports。