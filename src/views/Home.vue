<template>
  <div>
    <nav>
      W 
      <input id="input_width" value="1920" @input="change_canvas_size('w', $event.target.value)"><br>
      H
      <input id="input_height" value="1080" @change="change_canvas_size('h', $event.target.value)">
      Scale
      <input id="input_scale" type="range" value="0" min="-30" max="15" @change="change_canvas_scale($event.target.value)">
      Rotate
      <input id="input_rotate" type="range" value="0" min="-45" max="45" @change="change_canvas_rotate($event.target.value)">
      Flip X
      <input id="input_flip_x" type="checkbox" value="0" @change="change_canvas_flip($event.target.checked, 'x')"><br>
      Color<br>
      <input id="input_color1" type="color" value="#ffffff" @change="change_color">
      <input id="input_color2" type="color" value="#ffffff" @change="change_color"><br>

      Layer
      <draggable tag="ul" id="layer" @end="set_layer_order">
        <li v-for="id in layer_order" :key="id" :id="id" @click="click_layer"><img :src="get_layer_thumbnail(id)"></li>
      </draggable>

      <br>
      <button @click="delete_layer">Delete</button>
    </nav>

    <section id="main_section">
      <div id="canvas" width="1920" height="1080" @click="click_object()"></div>

      <div id="images">
        <img v-for="(image,i) in images" :key="i" :src="get_thumbnail(image.type, image.image_id)" @click="click_image(image.type, image.image_id)">
      </div>
    </section>
  </div>
</template>

<script>
import Mixin from '@/components/Common'
import define from '@/assets/js/define'
import axios from 'axios'
import interact from 'interactjs'
import draggable from 'vuedraggable'

export default {
  name: 'Home',
  mixins:[Mixin],
  props: {
    current: Object,
  },
  components: {
    'draggable': draggable,
  },
  data () {
    return {
      img_dir: define.IMG_BASE_URL,
      images: this.images,
      define: define,
      data: this.data,
      selected_layer: this.selected_layer,
      layer_order: this.layer_order,
    }
  },

  created() {
    String.prototype.id_num = function(){
      return this.replace('_', '').int()
    }

    this.set_images()


    window.dragMoveListener = this.dragMoveListener
    this.data = []
    this.layer_order = []
    this.canvas_w = 1920
    this.canvas_h = 1080

  },
  mounted(){
    this.set_canvas_view_size()
  },
  destroyed() {
  },
  watch:{
    '$route': function(to){
      console.log(to)
    },
  },
  methods:{
    change_canvas_size(side, size){
      if(size < 0 || size > 3000) return

      if(side === 'w'){
        this.canvas_w = size
        this.$$('#canvas').setAttribute('width', size)
        this.$$$('#canvas canvas').forEach(v=>{
          v.setAttribute('width', size)
          v.style.width = size + 'px'
        })
      }
      else if(side === 'h'){
        this.canvas_h = size
        this.$$('#canvas').setAttribute('height', size)
        this.$$$('#canvas canvas').forEach(v=>{
          v.setAttribute('height', size)
          v.style.height = size + 'px'
        })
      }

      this.set_canvas_view_size()
    },

    click_image(type, image_id){
      let img = new Image();
      img.crossOrigin = 'Anonymous'
      img.src = this.get_full(type, image_id)

      let _this = this
      let w = this.canvas_w
      let h = this.canvas_h
      img.onload = function(){
        let context = document.createElement('canvas')
        context.setAttribute('width', w)
        context.setAttribute('height', h)
        context.id = 'canvas_'+ _this.data.length

        let canvas_ratio = w / h
        let img_ratio = img.width / img.height
        let img_h, img_w
        let new_id = '_' + _this.data.length
        let color2 = (type === 'object') ? '#ffffff' : '#000000'


        if(canvas_ratio > img_ratio){
          img_w = h * img_ratio
          img_h = h
        }
        else{
          img_w = w
          img_h = w / img_ratio
        }
        context.getContext('2d').drawImage(img, 0, 0, img_w, img_h)
        
        _this.data.push({
          id: new_id,
          context: context,
          img: img,
          img_info: {
            image_id: image_id,
            type: type,
            x: 0,
            y: 0,
            w: img_w,
            h: img_h,
            scale: 0,
            rotate: 0,
            flip_x: 0,
            color1: '#ffffff',
            color2: color2,
          }
        })

        _this.layer_order.unshift(new_id)
        _this.set_layer_condition()
        _this.$$('#canvas').append(context)
        _this.set_canvas_view_size()
      }
      
    },

    click_object(){

    },

    click_layer(e){
      //this.set_layer_order()

      this.$$$('#layer li').forEach(v=>{
        v.style.border = ''
      })
      e.target.style.border = 'solid 1px #fff'
      this.selected_layer = e.target.id
console.log(this.selected_layer)
      let data = this.get_selected_layer_data()
      this.$$('#input_scale').value = data.img_info.scale
      this.$$('#input_rotate').value = data.img_info.rotate
      this.$$('#input_flip_x').checked = data.img_info.flip_x
      this.$$('#input_color1').value = data.img_info.color1
      this.$$('#input_color2').value = data.img_info.color2
    },

    change_canvas_rotate(v){
      //this.set_layer_order()

      let data = this.get_selected_layer_data()
      let rotate = data.img_info.rotate - v.int()
      this.last_rotate = rotate
      data.img_info.rotate = v.int()
      data.context.getContext('2d').clearRect(0, 0, 9999, 9999);
      data.context.getContext('2d').translate(data.img.width/2, data.img.height/2)
      data.context.getContext('2d').rotate(rotate/180*Math.PI)
      data.context.getContext('2d').translate(-data.img.width/2, -data.img.height/2)

      data.context.getContext('2d').drawImage(data.img, data.img_info.x, data.img_info.y, data.img_info.w, data.img_info.h)
    },

    change_canvas_scale(v){
      //this.set_layer_order()

      let data = this.get_selected_layer_data()
      let scale = data.img_info.scale - v.int()
      data.img_info.scale = v.int()
      data.img_info.w *= 0.9**scale
      data.img_info.h *= 0.9**scale
      data.context.getContext('2d').clearRect(0, 0, 9999, 9999);
      data.context.getContext('2d').drawImage(data.img, data.img_info.x, data.img_info.y, data.img_info.w, data.img_info.h)
    },

    change_canvas_flip(v, side){
      this.set_layer_order()
      let data = this.get_selected_layer_data()
      let is_x_minus = 1

      if(side === 'x'){
        if(v){
          data.img_info.flip_x = 1
          is_x_minus = -1
        }
        else{
          data.img_info.flip_x = 0
        }
        data.context.getContext('2d').scale(is_x_minus, 1)
        data.context.getContext('2d').translate(data.img_info.w * is_x_minus, 0);
        data.context.getContext('2d').clearRect(0, 0, 9999, 9999);
        data.context.getContext('2d').drawImage(data.img, data.img_info.x, data.img_info.y, data.img_info.w, data.img_info.h)
      }
    },

    change_color(){
      let data = this.get_selected_layer_data()
      let data_ = data.context.getImageData(0,0,300,303)
console.log(data_)
      for(var i=0; i<data.length; i+=4){
        if(data.data[i]>0){
          //data.data[i] = data.data[i]
          data.data[i+1] = 0
          data.data[i+2] = 250
          data.data[i+3] = data.data[i+3]
        }
      }

      data.putImageData(data, 0, 0);
    },

    create_image(context){
      var image= new Image
      image.src = context.canvas.toDataURL()
      return image
    },

    delete_layer(){
      let data = this.get_selected_layer_data()
      let id = data.id
      let index = id.id_num()
      this.data.splice(index, 1)
      this.layer_order.splice(this.layer_order.indexOf(id), 1)
      this.$$('#canvas' + id).remove()

      //採番しなおす
      this.data.forEach(v=>{
        let id_ = v.id.id_num()
        if(id_ > index){
          v.id = '_' + (id_-1)
          v.context.id = 'canvas_' + (id_-1)
        }
      })
      this.layer_order = this.layer_order.map(v=>{
        let id_ = v.id_num()
        if(id_ > index){
          return '_' + (id_-1)
        }
        return v
      })
    },

    get_thumbnail(type, image_id){
      return define.BASE_URL+type+'/thumbnail/'+image_id+'.png'
    },

    get_layer_thumbnail(id){
      id = id.id_num()
      let img_info = this.data[id].img_info
      return this.get_thumbnail(img_info.type, img_info.image_id)
    },

    get_full(type, image_id){
      return define.BASE_URL+type+'/full/'+image_id+'.png'
    },

    get_selected_layer_data(){
      //this.set_layer_order()

      let index = 0
      if(this.selected_layer){
        //index = this.layer_order.length - 1 - this.selected_layer.replace('_', '').int()
        index = this.selected_layer.id_num()
      }

      return this.data[index]
    },

    set_images(){
      let api = define.API_BASE_URL
      axios
        .get(api)
        .then(r=>{
          this.images = r.data.Items
        })
    },

    set_canvas_view_size(){
      let w, h
      let section_width = this.$$('#main_section').offsetWidth
      let window_ratio = section_width / window.innerHeight
      let canvas_ratio = this.canvas_w / this.canvas_h

      if(window_ratio > canvas_ratio){
        w = (window.innerHeight - 10) * canvas_ratio 
        h = window.innerHeight - 10
      }
      else{
        w = section_width
        h = section_width / canvas_ratio
      }

      this.$$('#canvas').style.width = w + 'px'
      this.$$('#canvas').style.height = h + 'px'
      this.$$$('#canvas canvas').forEach(v=>{
        v.style.width = w + 'px'
        v.style.height = h + 'px'
      })
    },

    set_layer_condition(){
      interact('#canvas')
        .draggable({
          inertia: false,
          autoScroll: false,
          // modifiers: [
          //   interact.modifiers.restrict({
          //     //restriction: 'parent',
          //     endOnly: true
          //   })
          // ],

          onstart: (e) => {
            this.dragStartListener(e);
          },

          onmove: (e) => {
            this.dragMoveListener(e)
          },

          // onend: (e) => {
          //   console.log(111, e, window.data[0].img_info.x)
          //   this.isDrag = false
          // },

          cursorChecker: (action, interactable, element, interacting) => {
            if(this.cursor){
              return this.cursor;
            }
            else {
              return interacting ? 'grabbing' : null;
            }
          }
        })
    },

    set_layer_order(){
      this.layer_order = []
      this.$$$('#layer li').forEach((v)=>{
        if(typeof v.id === 'string'){
          this.layer_order.push(v.id)
        }
      })
console.log(this.layer_order, this.layer_order.length)

      let data = []
      this.$$$('#canvas canvas').forEach(function(v){
        data.push(v)
      })

      let _this = this
      data.sort(function(x, y) {
        return _this.layer_order.indexOf(x.id.replace('canvas', '')) - _this.layer_order.indexOf(y.id.replace('canvas', ''));
      })

      data.forEach(function(v){
        _this.$$('#canvas').prepend(v)
      })
    
    },

    dragStartListener() {
        this.isDrag = true;
    },

    dragMoveListener (e) {
      if(!this.isDrag){
        return;
      }

      let data = this.get_selected_layer_data()

      data.context.getContext('2d').clearRect(-999, -999, 9999, 9999)
      let is_x_minus = data.img_info.flip_x ? -1 : 1
      data.img_info.x = data.img_info.x + e.dx * is_x_minus
      data.img_info.y = data.img_info.y + e.dy

      //let rotate = this.last_rotate ? this.last_rotate : 0
      // data.img_info.x = data.img_info.x + e.dx * Math.cos(rotate) + e.dy * Math.sin(rotate)
      // data.img_info.y = data.img_info.y + e.dx * Math.sin(rotate) + e.dy * Math.cos(rotate)

      data.context.getContext('2d').drawImage(data.img, data.img_info.x, data.img_info.y, data.img_info.w, data.img_info.h)
    },
  }
}

</script>

<style>
html, body{
    background: #333;
}
body{
    margin: 5px 0 0 0;
}

nav{
    margin: 0 0 0 0.5%;
    display: inline-block;
    width: 10%;
    vertical-align: top;
}
nav input{
    max-width: 90%;
}
#input_width, #input_height{
    width: 50px;
}
#layer{
    line-height: 0;
}
#layer img{
    width: 100%;
    pointer-events: none;
}

section{
    display: inline-block;
    width: 88.5%;
    vertical-align: top;
    margin: 0 0.5% 0 0.5%;
}

#canvas{
    border: solid 1px #000;
    margin: auto;
}
#canvas canvas{
    position: absolute;
}

#images img{
    vertical-align: middle;
}
</style>