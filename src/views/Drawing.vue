<template>
  <div>
    <nav>
      Scale
      <input id="input_scale" type="range" value="0" min="-30" max="15" @change="change_canvas_scale($event.target.value)" v-model="current_data.img_info.scale">
      Rotate
      <input id="input_rotate" type="range" value="0" min="-45" max="45" @change="change_canvas_rotate($event.target.value)" v-model="current_data.img_info.rotate">
      Flip X
      <input id="input_flip_x" type="checkbox" value="0" @change="change_canvas_flip($event.target.checked, 'x')" v-model="current_data.img_info.flip_x"><br>
      Color<br>
      <input id="input_color1" type="color" value="#ffffff" @change="set_color" v-model="current_data.img_info.color1">
      <input id="input_color2" type="color" value="#ffffff" @change="set_color" v-model="current_data.img_info.color2"><br>
      <a @click="set_color">set color</a>
      <div>
        Filter
        <input id="input_filter_alpha" type="range" value="100" min="0" max="100" @change="change_filter" v-model="current_data.filter.alpha">
        <select id="input_filter_type" name="filter" @change="change_filter" v-model="current_data.filter.type">
          <option v-for="(v,i) in filter_options" :value="i" :key="i">{{v}}</option>
        </select><br>
        <a @click="change_filter">set filter</a>
      </div>
      <div>
        Layer
      </div>
      <draggable tag="ul" id="layer" @end="set_layer_order">
        <li v-for="id in layer_order" :key="id" :id="id" @click="click_layer"><img :src="get_layer_thumbnail(id)"></li>
      </draggable>

      <div>
        <button @click="delete_layer">Delete</button>
      </div>
      <div>
        W×H<br>
        <input id="input_width" value="1920" @input="change_canvas_size('w', $event.target.value)">
        <input id="input_height" value="1080" @change="change_canvas_size('h', $event.target.value)">
      </div>
      <div>
        <a id="save" @click="save"><button>Save</button></a>
      </div>
    </nav>

    <section id="main_section">
      <div id="canvas" width="1920" height="1080"></div>

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
      current_data: this.current_data,
      background_info: this.background_info,
      filter_options: {
        'none': 'None',
        'screen': 'Screen',
        'color_dodge': 'Color Dodge',
        'linear_dodge': 'Linear Dodge',
        'multiply': 'Multiply',
        'color_burn': 'Color Burn',
        'linear_burn': 'Linear Burn',
        'overlay': 'Overlay',
        'soft_light': 'Soft Light',
        'hard_light': 'Hard Light',
        'vivid_light': 'Vivid Light',
        'subtract': 'Subtract',
        'divide': 'Divide',
      },
    }
  },

  created() {
    String.prototype.id_num = function(){
      return this.replace('_', '').int()
    }

    String.prototype.rgb = function(){
      return {
        r: ("0x"+this.slice(1,3)).int(),
        g: ("0x"+this.slice(3,5)).int(),
        b: ("0x"+this.slice(5,7)).int(),
      }
    }

    this.set_images()

    window.dragMoveListener = this.dragMoveListener
    this.data = []
    this.layer_order = []
    this.canvas_w = 1920
    this.canvas_h = 1080
    this.current_data = {
      img_info:{
        scale: 0,
        rotate: 0,
        x_flip: 0,
        color1: '#ffffff',
        color2: '#ffffff',
      },
      filter: {
        type: null,
        alpha: 100,
      }
    }
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
      let img = new Image()
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
        let img_h, img_w, x, y
        let new_id = '_' + _this.data.length
        let color2 = (type === 'object') ? '#ffffff' : '#000000'

        if(type === 'object'){
          if(canvas_ratio > img_ratio){
            img_w = h * img_ratio
            img_h = h
          }
          else{
            img_w = w
            img_h = w / img_ratio
          }

          x = (w - img_w) / 2
          y = (h - img_h) / 2
        }
        else{
          img_w = (w + 100)
          img_h = (w + 100) / img_ratio
          x = - 50
          y = - 50
        }
        context.getContext('2d').drawImage(img, x, y, img_w, img_h)
        
        _this.data.push({
          id: new_id,
          context: context,
          img: img,
          img_info: {
            image_id: image_id,
            type: type,
            x: x,
            y: y,
            w: img_w,
            h: img_h,
            base_w: img_w,
            base_h: img_h,
            scale: 0,
            rotate: 0,
            last_rotate: 0,
            flip_x: 0,
            color1: '#ffffff',
            color2: color2,
          },
          filter:{
            type: null,
            alpha: 100,
          }
        })

        _this.layer_order.unshift(new_id)
        _this.set_layer_condition()
        _this.$$('#canvas').append(context)
        _this.set_canvas_view_size()
      }
      
    },

    click_layer(e){
      this.$$$('#layer li').forEach(v=>{
        v.style.border = ''
      })
      e.target.style.border = 'solid 1px #fff'
      this.selected_layer = e.target.id

      let data = this.get_selected_layer_data()
      this.current_data = data
    },

    change_canvas_rotate(v){
      let data = this.current_data
      let rotate = v.int() - data.img_info.last_rotate
      data.img_info.rotate = v.int()
      data.img_info.last_rotate = v.int()
      data.context.getContext('2d').clearRect(0, 0, 9999, 9999);
      data.context.getContext('2d').translate(data.img.width/2, data.img.height/2)
      data.context.getContext('2d').rotate(rotate/180*Math.PI)
      data.context.getContext('2d').translate(-data.img.width/2, -data.img.height/2)

      data.context.getContext('2d').drawImage(data.img, data.img_info.x, data.img_info.y, data.img_info.w, data.img_info.h)
    },

    change_canvas_scale(v){
      let data = this.current_data
      let scale = v.int()

      data.img_info.scale = v.int()
      data.img_info.w = data.img_info.base_w / 0.9**scale
      data.img_info.h = data.img_info.base_h / 0.9**scale
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

    change_filter(){
      let type = this.$$('#input_filter_type').value
      let alpha = this.$$('#input_filter_alpha').value / 100

      let data = this.get_selected_layer_data()
      if(this.layer_order.indexOf(data.id) >= this.layer_order.length) return
      let picture_layer_id = this.layer_order[this.layer_order.indexOf(data.id) + 1].id_num()
      //let picture_layer = this.data[picture_layer_id]

      //reset
      data.context.getContext('2d').drawImage(data.img, data.img_info.x, data.img_info.y, data.img_info.w, data.img_info.h)

      let filter = this.$$('#canvas'+data.id).getContext('2d').getImageData(0, 0, this.canvas_w, this.canvas_h)
      let picture = this.$$('#canvas_'+picture_layer_id).getContext('2d').getImageData(0, 0, this.canvas_w, this.canvas_h)
      let fd = filter.data
      let pd = picture.data

      for(let i=0; i<fd.length; i+=4){
        let a = alpha * pd[i+3] / 255
        if(a < 1/255) continue
        for(let dlt=0; dlt<3; dlt++){
          let d = i+dlt
          switch(type){
            case 'screen':
              fd[d] = fd[d] + pd[d] - fd[d] * pd[d] / 255
              break
            case 'color_dodge':
              fd[d] = (pd[d] * 255) / (255 - fd[d])
              break
            case 'linear_dodge':
              fd[d] = fd[d] + pd[d]
              break
            case 'multiply':
              fd[d] = fd[d] * pd[d] / 255
              break
            case 'color_burn':
              fd[d] = 255 - (255 - pd[d]) * 255 / fd[d]
              break
            case 'linear_burn':
              fd[d] = fd[d] + pd[d] - 255
              break
            case 'overlay':
              if(pd[d] < 128) fd[d] = pd[d] * fd[d] * 2 / 255
              else fd[d] = (pd[d] + fd[d] - pd[d] * fd[d] / 255) * 2 - 255
              break
            case 'soft_light':
              if(pd[d] < 128) fd[d] = ( fd[d] / 255 ) ** ( ( 255 - pd[d] ) / 128 ) * 255
              else fd[d] = ( fd[d] / 255 ) ** ( 128 / pd[d] ) * 255
              break
            case 'hard_light':
              if(pd[d] < 128) fd[d] = fd[d] * pd[d] * 2 / 255
              else fd[d] = 2 * ( fd[d] + pd[d] - fd[d] * pd[d] / 255 ) - 255
              break
            case 'vivid_light':
              if(pd[d] < 128) fd[d] = 255 - (255 - pd[d]) * 255 / fd[d]
              else fd[d] = (255 ** 2 - 2 * (255 - pd[d]) * (255 - fd[d])) / 255
              break
            case 'subtract':
              fd[d] = pd[d] - fd[d]
              break
            case 'divide':
              fd[d] = pd[d] / fd[d] * 255
              break
          }

          if(fd[d] >= 255) fd[d] = 255
          else if(fd[d] <= 0) fd[d] = 0
          else fd[d] = fd[d].int()
        }
        
        fd[i+3] = (a * 255).int()
      }

      data.context.getContext('2d').putImageData(filter, 0, 0)
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
      let index = 0
      if(this.selected_layer){
        //index = this.layer_order.length - 1 - this.selected_layer.replace('_', '').int()
        index = this.selected_layer.id_num()
      }

      return this.data[index]
    },

    save(){
      let datas = []
      let new_data = new ImageData(this.canvas_w, this.canvas_h)
      let _this = this
      let i=0

      this.$$$('#canvas canvas').forEach(function(v){
        let img = v.getContext('2d').getImageData(0, 0, _this.canvas_w, _this.canvas_h)
        datas.push(img.data)
      })

      for(i=0; i<new_data.data.length; i++){
        new_data.data[i] = datas[0][i]
      }

      for(i=0; i<new_data.data.length; i+=4){
        for(var c=1; c<datas.length; c++){
          let alpha = datas[c][i+3] / 255
          if(alpha === 0) continue

          new_data.data[i] = (new_data.data[i] * (1-alpha) + datas[c][i] * alpha).int()
          new_data.data[i+1] = (new_data.data[i+1] * (1-alpha) + datas[c][i+1] * alpha).int()
          new_data.data[i+2] = (new_data.data[i+2] * (1-alpha) + datas[c][i+2] * alpha).int()
          new_data.data[i+3] = 255
        }
      }

      let context = document.createElement('canvas')
      context.setAttribute('width', this.canvas_w)
      context.setAttribute('height', this.canvas_h)
      context.getContext('2d').putImageData(new_data, 0, 0)

      let link = document.createElement('a')
      link.href = context.toDataURL()
      link.download = 'a.png'
      link.click()
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

    set_color(){
      let data = this.get_selected_layer_data()
      let color1_str = this.$$('#input_color1').value
      let color2_str = this.$$('#input_color2').value
      let color1 = color1_str.rgb()
      let color2 = color2_str.rgb()
      data.img_info.color1 = color1_str
      data.img_info.color2 = color2_str
      
      data.context.getContext('2d').drawImage(data.img, data.img_info.x, data.img_info.y, data.img_info.w, data.img_info.h)
      let image_data = data.context.getContext('2d').getImageData(0, 0, this.canvas_w, this.canvas_h)
      let data_ = image_data.data
      
      for(var i=0; i<data_.length; i+=4){
        if(data.img_info.type === 'object'){
          if(data_[i+3] === 255){
            continue
          }
          data_[i] = ((color1.r * data_[i+3] + color2.r * (255 - data_[i+3])) / 255).int()
          data_[i+1] = ((color1.g * data_[i+3] + color2.g * (255 - data_[i+3])) / 255).int()
          data_[i+2] = ((color1.b * data_[i+3] + color2.b * (255 - data_[i+3])) / 255).int()
        }
        else{
          if(data_[i]>0){
            data_[i] = ((color1.r * data_[i] + color2.r * (255 - data_[i])) / 255).int()
            data_[i+1] = ((color1.g * data_[i+1] + color2.g * (255 - data_[i+1])) / 255).int()
            data_[i+2] = ((color1.b * data_[i+2] + color2.b * (255 - data_[i+2])) / 255).int()
            //data_[i+3] = data_[i+3]
          }
        }
      }

      data.context.getContext('2d').putImageData(image_data, 0, 0)
    },

    set_layer_condition(){
      let _this = this

      let dragStartListener = function() {
          window.isDrag = true;
      }

      let dragMoveListener = function(e) {
        if(!window.isDrag){
          return;
        }

        let data = _this.get_selected_layer_data()

        data.context.getContext('2d').clearRect(-999, -999, 9999, 9999)
        let is_x_minus = data.img_info.flip_x ? -1 : 1
        data.img_info.x = data.img_info.x + e.dx * is_x_minus
        data.img_info.y = data.img_info.y + e.dy

        //let rotate = this.last_rotate ? this.last_rotate : 0
        // data.img_info.x = data.img_info.x + e.dx * Math.cos(rotate) + e.dy * Math.sin(rotate)
        // data.img_info.y = data.img_info.y + e.dx * Math.sin(rotate) + e.dy * Math.cos(rotate)

        data.context.getContext('2d').drawImage(data.img, data.img_info.x, data.img_info.y, data.img_info.w, data.img_info.h)
      }

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
            dragStartListener(e);
          },

          onmove: (e) => {
            dragMoveListener(e)
          },

          // onend: (e) => {
          //   this.set_color()
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
        return _this.layer_order.indexOf(x.id.replace('canvas', '')) - _this.layer_order.indexOf(y.id.replace('canvas', ''))
      })

      data.forEach(function(v){
        _this.$$('#canvas').prepend(v)
      })
    
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
nav div{
    margin: 0.5em 0;
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
    margin: 0 0 5px;
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
    margin-right: 5px; 
}
</style>