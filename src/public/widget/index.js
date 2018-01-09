/**
 * @files 基础 ST 组件,内容脚本和弹出页都会用到
 */

import '../fontello/css/selection-translator.css';

// https://github.com/fontello/fontello/wiki/How-to-use-fontello-fonts-in-your-project
import './style.scss';
import Vue from 'vue';
import widgetMixin from './vue-st';

import locales from '../locales';
import template from './template.html';

// 去掉 locales 里的 *-* 类语种，除了 zh-CN、zh-TW 和 zh-HK（百度翻译里的粤语）
const translateLocales = [];

locales.forEach( locale => {
  const {localeId} = locale;

  if ( !localeId.includes( '-' ) || ( localeId === 'zh-CN' || localeId == 'zh-TW' || localeId == 'zh-HK' ) ) {
    translateLocales.push( locale );
  }
} );

const resolvedEmptyPromise = Promise.resolve() ,
  noop = ()=> {};

/**
 * 翻译窗口的基础 Vue 构造函数。
 * 注意：这个构造函数需要一个额外的 options：client
 */

//  使用基础 Vue 构造器，创建一个“子类”。参数是一个包含组件选项的对象。

// data 选项是特例，需要注意 - 在 Vue.extend() 中它必须是函数
export default Vue.extend( {
  template ,
  data : ()=>({
    locales : translateLocales ,
    showForm : false ,
    query : {
      text : '' ,
      from : '' ,
      to : '' ,
      api : ''
    } ,
    result : {
      error : '' ,
      phonetic : '' ,
      detailed : [] ,
      result : [] ,
      linkToResult : '' ,
      response : {} ,
      api : {
        name : ''
      }
    }
  }) ,

  // 实例已经创建完成之后被调用。在这一步，实例已完成以下的配置：数据观测(data observer)，属性和方法的运算，watch/event 事件回调。然而，挂载阶段还没开始，$el 属性目前不可见。
  created() {
    this.$options.client.once( 'disconnect' , ()=> {
      this.result = {
        error : '连接到翻译引擎时发生了错误，请刷新网页或重启浏览器后再试。'
      }
    } );
  } ,
  methods : {

    /**
     * 翻译快捷键：Ctrl + Enter
     * @param event
     */
    ctrlEnter( event ) {
      if ( event.ctrlKey ) {
        this.safeTranslate();
      }
    } ,

    /**
     * 仅当有文本时才翻译
     */
    safeTranslate() {
      if ( this.query.text.trim() ) {
        this.translate();
      }
    } ,

    /**
     * 从后台网页获取查询结果
     * @returns {Promise}
     */
    getResult() {
      if ( this.$options.client.disconnected ) {
        return resolvedEmptyPromise;
      }
      return this.$options.client
        .send( 'get translate result' , this.query , true )
        .then( resultObj => {
          const {phonetic} = resultObj;
          /* istanbul ignore if */
          if ( phonetic ) {
            resultObj.phonetic = '/' + phonetic + '/';
          }
          this.result = resultObj;
        } , noop );
      // 只有在一种特殊情况下才会走进 catch 分支:
      // 消息发送出去后但还没得到响应时就被后台断开了连接.
      // 不过出现这种情况的可能性极低.
    } ,

    /**
     * 交换源语种与目标语种
     */
    exchangeLocale() {
      const {to,from} = this.query;
      this.query.to = from;
      this.query.from = to;
    } ,

    /**
     * 打开设置页
     */
    openOptions() {
      this.$options.client.send( 'open options' );
    } ,

    /**
     * 复制文本
     * @param {String|String[]} textOrTextArray
     * @param {MouseEvent} event
     */
    copy( textOrTextArray , event ) {
      if ( Array.isArray( textOrTextArray ) ) {
        textOrTextArray = textOrTextArray.join( '\n' );
      }
      this.$options.client.send( 'copy' , textOrTextArray );

      const {target} = event ,
        original = target.textContent;
      target.textContent = '已复制';
      setTimeout( ()=> target.textContent = original , 2000 );
    } ,

    /**
     * 播放语音
     * @param {String|String[]} textOrTextArray
     * @param {String} [lang] - 文本的语种
     */
    play( textOrTextArray , lang ) {
      if ( Array.isArray( textOrTextArray ) ) {
        textOrTextArray = textOrTextArray.join( '\n' );
      }
      this.$options.client.send( 'play' , {
        text : textOrTextArray ,
        api : this.query.api ,
        from : lang
      } );
    }
  } ,
  mixins : [ widgetMixin ]
//   mixins 选项接受一个混合对象的数组。这些混合实例对象可以像正常的实例对象一样包含选项,他们将在 Vue.extend() 里最终选择使用相同的选项合并逻辑合并。举例：如果你混合包含一个钩子而创建组件本身也有一个,两个函数将被调用。
// Mixin钩子按照传入顺序依次调用,并在调用组件自身的钩子之前被调用。

// 示例：

// var mixin = {
//   created: function () { console.log(1) }
// }
// var vm = new Vue({
//   created: function () { console.log(2) },
//   mixins: [mixin]
// })
// // => 1
// // => 2
} );

