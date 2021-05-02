import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component:() => import('@/views/Home.vue'),
  },
  {
    path: '/object',
    name: 'object',
    component:() => import('@/views/Object.vue'),
  },
  {
    path: '/drawing',
    name: 'drawing',
    component:() => import('@/views/Drawing.vue'),
  },
  {
    path: '/product',
    name: 'product',
    component:() => import('@/views/Product.vue'),
  },
]

const router = new VueRouter({
  mode: 'history',
//  base: process.env.BASE_URL,
  routes,
})

export default router
