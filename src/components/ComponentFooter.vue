<template>
  <footer>
    <p>
      <router-link :to="{'name':'home'}">HOME</router-link>
    </p>
    <p class="copyright">©2021 Sabian Symbols Images rights reserved.</p>
  </footer>
</template>

<script>
export default {
  name: 'ComponentFooter',
  components: {
  },
  data(){
    return {
    }
  }
}
</script>

