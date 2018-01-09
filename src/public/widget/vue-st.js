/**
 * @files 提取出来基本的 ST 组件配置
 */

// istanbul 提供注释语法，允许某些代码不计入覆盖率。

// var object = parameter || /* istanbul ignore next */ {};
// 上面代码是为 object 指定默认值（一个空对象）。如果由于种种原因，没有为 object 为空对象的情况写测试，可以用注释，不将这种情况计入覆盖率。注意，注释要写在"或"运算符的后面。
// HTML5实战与剖析之触摸事件(touchstart、touchmove和touchend)
const IS_TOUCH = 'ontouch' in window ,
  MOUSE_DOWN = IS_TOUCH
    /* istanbul ignore next */ ? 'touchstart'
    /* istanbul ignore next */ : 'mousedown' ,
  MOUSE_UP = IS_TOUCH
    /* istanbul ignore next */ ? 'touchend'
    /* istanbul ignore next */ : 'mouseup' ,
  modifierKey = navigator.userAgent.toLowerCase().indexOf( 'macintosh' ) > 0
    /* istanbul ignore next */ ? 'metaKey'
    /* istanbul ignore next */ : 'ctrlKey' ,
  selection = getSelection();
  // 返回一个  Selection 对象，表示用户选择的文本范围或插入符号的当前位置。

// el=element
export default {
  el : ()=> document.createElement( 'div' ) ,
  data : ()=> ({

    _events : [] ,

    // 查询对象
    query : {
      text : ''
    } ,

    // 结果对象
    result : {} ,

    loading : false , // 是否正在查询中
    showResult : true , // 是否显示翻译结果。inline 模式下，这个值会变成 false，并且在第一次翻译之后会变成 true。

    inline : false , // 是否为 inline 模式:总是显示,不会移动位置,改变大小或定位
    selection : true , // 是否响应划词事件
    pinned : false , // 设为 pinned 状态，此时不会隐藏翻译按钮&窗口、不会重新定位
    ignoreChinese : true , // 是否忽略中文
    // ignoreNumLike : true , // 忽略数字与符号的组成
    ignoreNumLike : false , // 忽略数字与符号的组成 change

    showBtn : true , // 是否在划词后显示一个按钮，点击它才翻译
    needCtrl : false , // 是否需要配合 Ctrl 键才翻译

    // 定位的样式属性，用于翻译按钮
    btnPos : {
      show : false ,
      position : 'fixed' ,
      zIndex : 99999 ,
      translateX : 0 ,
      translateY : 0
    } ,

    // 定位的样式属性，用于翻译窗口
    boxPos : {
      show : false ,
      position : 'fixed' ,
      zIndex : 99999 ,
      translateX : 0 ,
      translateY : 0
    }
  }) ,
  // 这就是对于任何复杂逻辑，你都应当使用计算属性的原因。
  computed : {

    // 翻译窗口的行内样式
    boxStyle() {
      const {boxPos} = this;
      return {
        display : boxPos.show ? 'block' : 'none' ,
        position : boxPos.position ,
        zIndex : boxPos.zIndex ,
        left : 0 ,
        top : 0 ,
        transform : `translateX(${boxPos.translateX}px) translateY(${boxPos.translateY}px)`
      };
    } ,

    //翻译按钮的行内样式
    btnStyle() {
      const {btnPos} = this;
      return {
        display : btnPos.show ? 'block' : 'none' ,
        position : btnPos.position ,
        zIndex : btnPos.zIndex ,
        left : 0 ,
        top : 0 ,
        transform : `translateX(${btnPos.translateX}px) translateY(${btnPos.translateY}px)`
      };
    }
  } ,
  // Vue 确实提供了一种更通用的方式来观察和响应 Vue 实例上的数据变动：watch 属性。当你有一些数据需要随着其它数据变动而变动时，
  watch : { // vue 不会在初始化时触发一遍 watch，所以要提醒用户不要在初始化时覆盖这些值，应该在初始化后再手动改变
    inline( newVal ) {
      if ( newVal ) {
        this.boxPos.position = 'static';
        this.boxPos.show = true;
      } else {
        this.boxPos.position = 'fixed';
      }
    }
  } ,
  methods : {

    getResult() {
      throw new Error( '请指定 getResult 方法！' );
    } ,

    /**
     * 翻译的方法
     * @returns {Promise}
     */
    translate() {
      this.loading = true;
      this.boxPos.show = true;  
      // 展示窗口
      this.$emit( 'before translate' );

      return this
        .getResult()
        .then( ()=> {
          this.loading = false;
          this.boxPos.show = true;
          this.$emit( 'after translate' );
        } );
    }

  } ,
  beforeCompile() {
    const unwatch = this.$watch( 'inline' , ( value )=> {
      if ( value ) {
        unwatch();
        this.showResult = false;
        this.$once( 'before translate' , ()=> {
          this.showResult = true;
        } );
      }
    } );
  } ,
  ready() {
    const {$els} = this ,
      $box = $els.stBox ,
      $btn = $els.stBtn ,
      events = this.$data._events;

    // 按下鼠标时执行的动作
    this.$on( 'mousedown' , e => {
      const {target} = e;
      if ( $btn.contains( target ) ) {
        e.preventDefault(); // 点击翻译按钮时防止划选的文本消失掉
        this.query.text = getText();
        this.translate();
      } else if ( !(this.loading || $box.contains( target ) || this.pinned || this.inline) ) {
        this.boxPos.show = false;
      }
      this.btnPos.show = false;
    } );

    // 鼠标弹起时执行的动作
    this.$on( 'mouseup' , e => {
      setTimeout( ()=> {
        const text = getText();
        if ( text && !$box.contains( e.target ) && 0 === e.button ) {
          this.$emit( 'select' , e , text );
        }
      } , 0 );
    } );

    // 选中文字时执行的动作
    this.$on( 'select' , ( e , text )=> {
      if ( check( this , e , text ) ) {
        const left = e.pageX - window.pageXOffset ,
          top = e.pageY - window.pageYOffset + 10 ,
          {btnPos} = this;

        btnPos.translateX = left;
        btnPos.translateY = top;

        if ( !(this.pinned || this.inline) ) {
          const {boxPos} = this;
          boxPos.translateX = left;
          boxPos.translateY = top;
        }

        if ( this.showBtn && !(this.needCtrl && e[ modifierKey ]) ) { // 指定 Ctrl 时直接翻译
          btnPos.show = true;
        } else {
          this.query.text = text;
          this.translate();
        }
      }
    } );
// Push Event to the Client Using Vue - Laracasts
// `event` 是原生DOM 事件.
    /* istanbul ignore next */
    events.push( listen( document , MOUSE_DOWN , e => this.$emit( 'mousedown' , e ) , true ) );
    /* istanbul ignore next */
    events.push( listen( document , MOUSE_UP , e => this.$emit( 'mouseup' , e ) ) );
  } ,
  beforeDestroy() {
    this.$data._events.forEach( r => r() );
  }
};
// 下划线_envents 是啥意思

/**
 * 检查一次翻译行为是否可翻译
 * @param {Vue} st
 * @param {MouseEvent} event - 触发事件时的事件对象
 * @param {HTMLElement} event.target - 覆盖默认的 EventTarget 类型
 * @param {String} text - 待检查的文本
 * @returns {Boolean} - 结果
 */
function check( st , event , text ) {
  if ( st.selection && !st.loading ) {
    // 忽略中文
    if ( st.ignoreChinese && /[\u4e00-\u9fa5]/.test( text ) ) {
      return false;
    }

    // 只匹配数字
    // if ( /[0-9]+/.test( text ) ) {
    //   return true ;
    // } else {
    //   return false;
    // }

//     test() 方法用于检测一个字符串是否匹配某个模式.
// 语法
// RegExpObject.test(string)

    
    /*
    太复杂 搞不定这个东西。。。。
     重要isbn都是数字
     重要isbn都是数字
     重要isbn都是数字
     */
    // 忽略类数字组合, 注释掉 change
    // if ( st.ignoreNumLike && /^[\s.\-0-9()•+]+$/.test( text ) ) {
    //   return false;
    // }


    if ( !st.showBtn && st.needCtrl && !event[ modifierKey ] ) {
      return false;
    }

    
  }
  return false;
}

/**
 * 获取网页上被选中的文本
 * @returns {String}
 */
function getText() {
  return selection.toString().trim();
}

/**
 * 注册事件的方法
 * @param {Document|HTMLElement} dom
 * @param {...String|Function|Boolean} listenerArgs - addEventListener 的参数
 * @returns {Function} - 取消事件监听的函数
 */
function listen( dom , ...listenerArgs ) {
  dom.addEventListener( ...listenerArgs );
  return ()=> {
    dom.removeEventListener( ...listenerArgs );
  };
}
