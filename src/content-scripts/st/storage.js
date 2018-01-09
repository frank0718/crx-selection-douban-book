/**
 * @files 将翻译窗口与扩展的 storage “绑定”起来
 */

import {isHostEnabled} from '../../public/util';
import watch from '../../public/storage-watcher';

export default function ( st ) {
  let defApi = '';

  function onAfterTranslate() {
    const {query} = this ,
      {text} = query;

    // autoPlay 属性是在 onStorageChanged 的时候扩展进去的
    if ( this.autoPlay && text.length < 50 ) {
      this.play( text , query.from );
    }
  }

  async function onStorageChanged( items ) {
    const {defaultApi,excludeDomains} = items;

    if ( defaultApi ) {
      defApi = defaultApi;
      if ( !st.boxPos.show ) {
        st.query.api = defApi;
      }
      delete items.defaultApi;
    }

    if ( items.disableSelection ) {
      st.selection = false;
    } else if ( excludeDomains ) {
      st.selection = await isHostEnabled( location , excludeDomains );
      delete items.excludeDomains;
    }

    Object.assign( st , items );
  }

  function onBoxPosShow( isShow ) {
    if ( !isShow ) {
      this.query.api = defApi;
    }
  }

  /* istanbul ignore next */
  if ( process.env.NODE_ENV === 'testing' ) {
    st.__onBoxShow = onBoxPosShow;
    st.__afterTs = onAfterTranslate;
    st.__onStorageChanged = onStorageChanged;
  } else {
    // 监听是否显示box
    // st是个vue对象
    // 观察 Vue 实例变化的一个表达式或计算属性函数。回调函数得到的参数为新值和旧值。表达式只接受监督的键路径。对于更复杂的表达式，用一个函数取代。

    st.$watch( 'boxPos.show' , onBoxPosShow );
    st.$on( 'after translate' , onAfterTranslate );
    // 监听当前实例上的自定义事件。事件可以由vm.$emit触发。回调函数会接收所有传入事件触发函数的额外参数。
    watch( [
      'ignoreChinese' , 'ignoreNumLike' , 'showBtn' , 'disableSelection' ,
      'needCtrl' , 'defaultApi' , 'excludeDomains' , 'autoPlay'
    ] , onStorageChanged );
    // 监听这些配置的变更
  }
}
