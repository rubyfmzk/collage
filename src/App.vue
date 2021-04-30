<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import Mixin from '@/components/Common'

export default {
  mixins:[Mixin],
  components: {
  },

  watch:{
    '$route': function(to){
      //スクロール位置
      if(!to.hash){
        window.scrollTo(0, 0)//トップへ
      }
      else{
        this.toAnchor(to.hash)
      }
    }
  },

  data () {
    return {
    }
  },
}
</script>

<style scoped>
@import url("assets/css/common.scss");
</style>