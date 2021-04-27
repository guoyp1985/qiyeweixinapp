import Reg from './reg'
import Config from '../config'
import Time from './time'
import wepy from 'wepy'
const Util = {
  // 去空格
  trim: (str) => str ? str.toString().replace(Reg.rSpace, '') : '',
  // 判空
  isNull: (str) => {
    if (!str) {
      return true
    }
    return !Reg.rNoSpace.test(Util.trim(str))
  },
  isArray: object => Object.prototype.toString.call(object) === '[object Array]',
  isFunction: object => Object.prototype.toString.call(object) === '[object Function]',
  isString: object => Object.prototype.toString.call(object) === '[object String]',
  validate: (model, reg, failHandle) => {
    let re = null
    let stop = null
    reg = typeof reg === 'string' ? new RegExp(reg) : reg
    if (model.value == undefined || model.value == null) {
      re = false
    } else if (reg && model) {
      re = reg.test(model.value)
    }
    return re ? re : (stop = failHandle(model))
  },
  validateQueue: (items, failHandle) => {
    let re = true
    failHandle = failHandle ? failHandle : () => false
    for (let item of items) {
      let rs = null
      for (let n in item) {
        if (!/^r|required$/.test(n)) {
          const k = n
          const v = item[n]
          if (item.required == undefined || item.required || ( item.required === false && (Util.trim(v) !== '') )) {
            rs = Util.validate({key: k, value: v}, Reg[`r${item.r}`] || Reg.rHas, failHandle)
          } else if (!item.required && (Util.trim(v) == '')) {
            rs = true
          }
        }
      }
      !rs && (re = false)
      if (rs === false) return false
    }
    return re;
  },
  getItem: (list, id) => {
    for (let item of list) {
      if (item.id === id) {
        return item
      }
    }
  },
  deleteItem: (list, id) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list.splice(i, 1)
        break
      }
    }
  },
  changeItem: (list, id, callback) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        let item = callback(list[i])
        list.splice(i, 1, item)
        break
      }
    }
    return list
  },
  previewImgData: (images) => {
    let ret = []
    for (let img of images) {
      ret.push({
        msrc: img,
        src: img
      })
    }
    return ret
  },
  filter: function (data, param) {
    if (!data) return
    for (let item of data) {
      for (let key in param) {
        const value = item[key]
        item[key] = param[key].call(this, value, item)
      }
    }
    return data
  },
  filterUriSlash: (uri) => {
    return uri.replace(/\//g, '')
  },
  joinParams: (params) => {
    const paramStrs = []
    for (let p in params) {
      paramStrs.push(`${p}=${params[p]}`)
    }
    return paramStrs.join('&')
  },
  setPhoto: (src) => {
    return src.replace(/,/g, '||')
  },
  getPhoto: (src) => {
    if (!src) {
      return ''
    }
    let arr = src.split(',')
    if (arr.length > 0) {
      src = arr[0]
    }
    return src.replace(/\|\|/g, ',')
  },
  delay: (text) => {
    let ret = 1000
    let len = text.length
    if (len > 0) {
      ret = len * 200
      if (ret < 1000) {
        ret = 1000
      } else if (ret > 600000) {
        ret = 600000
      }
    }
    return ret
  },
  getDateState: (dt) => {
    let newtime = new Time(dt * 1000)
    let year = newtime.year()
    let month = newtime.month()
    let date = newtime.date()
    let nowtime = new Time(new Date())
    let nowyear = nowtime.year()
    let nowmonth = nowtime.month()
    let nowdate = nowtime.date()
    let state = ''
    if (year === nowyear && month === nowmonth) {
      if (date === nowdate) {
        state = '今'
      } else if (date + 1 === nowdate) {
        state = '昨'
      } else if (date + 2 === nowdate) {
        state = '前'
      }
    }
    return state
  },
  getDateClass: (dt) => {
    const self = this
    let state = self.getDateState(dt)
    let ret = 'datestate '
    if (state !== '') {
      if (state === '今') {
        ret += 'today'
      } else if (state === '昨') {
        ret += 'yesterday'
      } else if (state === '前') {
        ret += ''
      } else {
        ret += 'hide'
      }
    } else {
      ret += 'hide'
    }
    return ret
  },
  taskData: (options) => {
    let data = options.data
    if(data && data.length > 0) {
      let params = options.params
      let handleFunction = options.handleFunction
      let ascdesc = options.ascdesc ? options.ascdesc : "asc"
      let callback = options.callback
      let tasks = []
      if (ascdesc === 'asc') {
        for (let i = 0; i < data.length; i++) {
          if (params) {
            params['dataindex'] = i
          }
          tasks.push(handleFunction(data[i], params))
        }
      } else {
        for (let i = data.length - 1; i >= 0; i--) {
          if (params) {
            params['dataindex'] = i
          }
          tasks.push(handleFunction(data[i], params))
        }
      }
      var _serial = function () {
        if (tasks.length === 0) {
          callback && callback(data)
          return
        }
        let task = tasks[0]
        tasks.splice(0, 1)
        task(_serial)
      }
      _serial()
    }
  },
  objectToUrl: (url, obj) => {
    let retUrl = url
    let arr = []
    let arrStr = ''
    for (let key in obj) {
      arr.push(`${key}=${obj[key]}`)
    }
    if (arr.length) {
      arrStr = arr.join('&')
      if (url.indexOf('?') < 0) {
        retUrl = `${url}?`
      }
    }
    retUrl = `${retUrl}${arrStr}`
    return retUrl
  },
  query: (url) => {
    let query = {}
    let lastindex = url.lastIndexOf('?')
    if (lastindex >= 0) {
      url = url.substr(lastindex + 1)
    } else {
      return query
    }
    let params = url.split('&')
    for (let i = 0; i < params.length; i++ ) {
      let p = params[i].split('=')
      query[p[0]] = p[1]
    }
    return query
  },
  queryScene: (scene) => {
    scene = decodeURIComponent(scene)
    let query = {}
    let params = scene.split(',')
    console.log('进入到了queryscene')
    console.log(params)
    for (let i = 0; i < params.length; i++ ) {
      let p = params[i].split(':')
      query[p[0]] = p[1]
    }
    if (query.ud) {
      query.uid = query.ud
      delete query.ud
    }
    if (query.sd) {
      query.share_uid = query.sd
      delete query.sd
    }
    if (query.wd) {
      query.wid = query.wd
      delete query.wd
    }
    if (query.cre) {
      query.creater = query.cre
      delete query.cre
    }
    if (query.pm) {
      query.module = query.pm
      delete query.pm
    }
    if (query.fd) {
      query.fid = query.fd
      delete query.fd
    }
    if (query.swd) {
      query.share_wid = query.swd
      delete query.swd
    }
    if (query.m) {
      query.module = query.m
      delete query.m
    }
    if (query.rid) {
      query.roomid = query.rid
      delete query.rid
    }
    return query
  },
  toDecimal: (data, num, flag) => {
    let ret = 0
    if (isNaN(data)) {
      ret = 0
    }
    let dataStr = `${data}`
    if (dataStr.indexOf('.') > -1) {
      ret = parseFloat(data).toFixed(num)
    } else {
      ret = parseInt(data)
      if (!flag) {
        ret = ret.toFixed(num)
      }
    }
    return ret
  },
  Ajax: (options) => {
    let url = options.url
    let method = options.method ? options.method : 'get'
    let data = options.data ? options.data : {}
    let success = options.success
    let promise = new Promise((resolve, reject) => {
      wepy.request({
        url: url,
        data: data,
        method: method,
        success: (res) => {
          if (success) {
            success(res)
          }
          resolve()
        }
      })
    })
    return promise
  },
  savePhoto: (options) => {
    let filePath = options.path
    let tip = options.tip ? options.tip : '保存成功！打开微信扫一扫，从相册中选择图片并识别！'
    let showTip = options.showTip === undefined || options.showTip === 'undefined' ? true : options.showTip
    console.log('相册的保存图片路径')
    console.log(filePath)
    console.log('是否提示', showTip)
    console.log('提示内容', tip)
    wepy.saveImageToPhotosAlbum({
      filePath: filePath
    }).then(res => {
      console.log('进入到了保存相册')
      console.log(res)
      if (res.errMsg === 'saveImageToPhotosAlbum:ok') {
        console.log()
        if (showTip) {
          wepy.showToast({
            title: tip,
            icon: 'none',
            duration: Util.delay(tip)
          })
        }
      } else {
        wepy.showToast({
          title: '图片保存失败',
          icon: 'none'
        })
      }
      if (options.callback) {
        options.callback()
      }
    }, res => {
      console.log('进入到了失败')
      console.log(res)
      let errArr = ['saveImageToPhotosAlbum:fail auth deny', 'saveImageToPhotosAlbum:fail:auth denied', 'saveImageToPhotosAlbum:fail authorize no response']
      let isError = false
      for (let i = 0; i < errArr.length; i++) {
        if (res.errMsg === errArr[i]) {
          isError = true
          break
        }
      }
      if (isError) {
        wepy.showToast({
          title: '请打开小程序保存到相册的权限',
          icon: 'none',
          duration: 4000
        })
        if (options.saveError) {
          options.saveError()
        }
      } else if (res.errMsg === 'saveImageToPhotosAlbum:fail file not found') {
        wepy.showToast({
          title: '图片不存在',
          icon: 'none',
          duration: 4000
        })
        if (options.photoError) {
          options.photoError()
        }
      }
    })
  },
  saveVideo: (options) => {
    let filePath = options.path
    let tip = options.tip ? options.tip : '保存成功，请到手机相册中查看'
    let showTip = options.showTip === undefined || options.showTip === 'undefined' ? true : options.showTip
    wepy.saveVideoToPhotosAlbum({
      filePath: filePath
    }).then(res => {
      console.log('进入到了保存相册')
      console.log(res)
      if (res.errMsg === 'saveVideoToPhotosAlbum:ok') {
        if (showTip) {
          wepy.showToast({
            title: tip,
            icon: 'none',
            duration: Util.delay(tip)
          })
        }
      } else {
        wepy.showToast({
          title: '视频保存失败',
          icon: 'none'
        })
      }
      if (options.callback) {
        options.callback()
      }
    }, res => {
      console.log('进入到了失败')
      console.log(res)
      let errArr = ['saveVideoToPhotosAlbum:fail auth deny', 'saveVideoToPhotosAlbum:fail:auth denied', 'saveVideoToPhotosAlbum:fail authorize no response']
      let isError = false
      for (let i = 0; i < errArr.length; i++) {
        if (res.errMsg === errArr[i]) {
          isError = true
          break
        }
      }
      if (isError) {
        wepy.showToast({
          title: '请打开小程序保存到相册的权限',
          icon: 'none',
          duration: 4000
        })
        if (options.saveError) {
          options.saveError()
        }
      } else if (res.errMsg === 'saveVideoToPhotosAlbum:fail file not found') {
        wepy.showToast({
          title: '文件不存在',
          icon: 'none',
          duration: 4000
        })
        if (options.photoError) {
          options.photoError()
        }
      }
    })
  },
  handleTxtOverflow: (str, count) => {
    let ret = str
    if (ret.length && ret.length > count) {
      ret = ret.substr(0, count)
      ret = `${ret}...`
    }
    return ret
  },
  remindQrcode: (wid) => {
    wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/retailer/remindQrCode`,
      data: {wid: wid, appid: Config.AppId},
      method: 'post'
    })
  },
  handleSex: (val) => {
    let ret = '未知'
    if (val === '1' || val === 1) {
      ret = '女'
    } else if (val === '0' || val === 0) {
      ret = '男'
    }
    return ret
  },
  getShareParams: (params) => {
    let retparams = {}
    if (params.wid) {
      retparams.wid = params.wid
    }
    if (params.share_uid) {
      retparams.share_uid = params.share_uid
    }
    if (params.comefrom) {
      retparams.comefrom = params.comefrom
    }
    if (params.lastshareuid) {
      retparams.lastshareuid = params.lastshareuid
    }
    return retparams
  },
  appInit: (globalData, app) => {
    let bg = Config.BackgroundColor
    let font = Config.FrontColor
    const sys = globalData.SystemParams
    console.log('进入到了appinit')
    console.log(sys)
    let sysBg = sys.BackgroundColor
    let sysFont = sys.FontColor
    if (sysFont === '0' || sysFont === 0) {
      font = '#000000'
    } else {
      font = '#ffffff'
    }
    if (sysBg && sysBg !== '') {
      bg = sysBg
    }
    bg = bg.toLowerCase()
    wepy.setNavigationBarColor({
      frontColor: font,
      backgroundColor: bg
    })
    if (app) {
      let topColor = sys.BackgroundColor
      let themeColor = sys.TopicColor
      app.themeObject = {
        topColor: topColor,
        themeColor: themeColor,
        colorStyle: `color:${themeColor} !important;`,
        bgStyle: `background-color:${themeColor} !important;color:#fff;`,
        linearBgStyle: `background:linear-gradient(${topColor}, ${themeColor});`,
        borderStyle: `border-color:${themeColor} !important;`,
        switchShadowStyle: `box-shadow:0 2rpx 6rpx ${themeColor};`
      }
    }
  },
  compareVersion: (v1, v2) => {
    v1 = v1.split('.')
    v2 = v2.split('.')
    const len = Math.max(v1.length, v2.length)

    while (v1.length < len) {
      v1.push('0')
    }
    while (v2.length < len) {
      v2.push('0')
    }

    for (let i = 0; i < len; i++) {
      const num1 = parseInt(v1[i])
      const num2 = parseInt(v2[i])

      if (num1 > num2) {
        return 1
      } else if (num1 < num2) {
        return -1
      }
    }

    return 0
  },
  uniqArray: (arr1, arr2, name) => {
    let retarr = arr2
    if (arr1.length) {
      for (let i = 0; i < arr2.length; i++) {
        let obj1 = arr2[i]
        for (let j = 0; j < arr1.length; j++) {
          let obj2 = arr1[j]
          console.log(`${obj2[name]}===${obj1[name]}`, (obj2[name] === obj1[name]))
          if (obj2[name] === obj1[name]) {
            arr2.splice(i, 1)
            i--
            break
          }
        }
      }
    }
    return retarr
  },
  checkTmpMsg: (os) => {
    // iOS客户端7.0.5版本、Android客户端7.0.6版本之前的一次订阅只支持一个模板消息
    let systeminfo = os.systeminfo
    let tmplIds = os.tmplIds
    let callback = os.callback
    let wxVersion = systeminfo.version
    let arr = wxVersion.split('.')
    let v1 = parseInt(arr[0])
    let v2 = parseInt(arr[1])
    let v3 = parseInt(arr[2])
    if (v1 > 7 || (v1 === 7 && v2 > 0) || (v1 === 7 && v2 === 0 && ((systeminfo.platform === 'android' && v3 > 5) || (systeminfo.platform !== 'android' && v3 > 6)))) {
      wepy.requestSubscribeMessage({
        tmplIds: tmplIds
      }).then(res => {
        console.log('in 订阅消息')
        console.log(res)
        callback && callback()
      }, res => {
        console.log('in 订阅消息error')
        console.log(res)
        if (res.errCode === 20004) {
          wepy.showToast({
            title: '请打开小程序订阅消息的权限',
            icon: 'none',
            duration: 2000
          })
          setTimeout(() => {
            callback && callback()
          }, 2000)
        } else {
          callback && callback()
        }
      })
    } else {
      wepy.showToast({
        title: '微信版本过低',
        icon: 'none',
        duration: 1500
      })
      setTimeout(() => {
        callback && callback()
      }, 1500)
    }
  },
  colorRgb: (color, opacity) => {
    // 16进制颜色值的正则
    let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    // 把颜色值变成小写
    color = color.toLowerCase()
    if (reg.test(color)) {
      // 如果只有三位的值，需变成六位，如：#fff => #ffffff
      if (color.length === 4) {
        let colorNew = '#'
        for (let i = 1; i < 4; i += 1) {
          colorNew += color.slice(i, i + 1).concat(color.slice(i, i + 1))
        }
        color = colorNew
      }
      // 处理六位的颜色值，转为RGB
      let colorChange = []
      for (let i = 1; i < 7; i += 2) {
        colorChange.push(parseInt('0x' + color.slice(i, i + 2)))
      }
      let ret = 'RGB(' + colorChange.join(',') + ')'
      if (opacity) {
        ret = 'rgba(' + colorChange.join(',') + ', '+ opacity+')'
      }
      return ret
    } else {
      return color
    }
  },
  colorHex: (color) => {
    let values = color.replace(/rgba?\(/, '').replace(/\)/, '').replace(/[\s+]/g, '').split(',')
    let a = parseFloat(values[3] || 1)
    let r = Math.floor(a * parseInt(values[0]) + (1 - a) * 255)
    let g = Math.floor(a * parseInt(values[1]) + (1 - a) * 255)
    let b = Math.floor(a * parseInt(values[2]) + (1 - a) * 255)
    let ret = '#' + ('0' + r.toString(16)).slice(-2) + ('0' + g.toString(16)).slice(-2) + ('0' + b.toString(16)).slice(-2)
    return ret
  },
  clickBanner: (e, page) => {
    const dataset = e.currentTarget.dataset
    const data = dataset.data
    let curModule = data.modules
    console.log(curModule)
    console.log(Config.Router[curModule])
    if (curModule !== '' && data.moduledata) {
      let navurl = `/${Config.Router[curModule]}?id=${data.moduleid}`
      if (curModule === 'minilive') {
        let customParams = {share_uid: page.userInfo.uid, share_wid: page.globalData.Wid, wid: page.globalData.Wid, liveid: data.moduleid}
        let cpstr = encodeURIComponent(JSON.stringify(customParams))
        navurl = `plugin-private://wx2b03c6e691cd7370/pages/live-player-plugin?room_id=${data.moduledata.roomid}&custom_params=${cpstr}`
      }
      wepy.navigateTo({url: navurl})
    } else {
      wepy.previewImage({
        current: 0,
        urls: [data.photo]
      })
    }
  },
  Rad: (d) => { // 计算距离函数
    // 根据经纬度判断距离
    return d * Math.PI / 180.0
  },
  getDistance: (lat1, lng1, lat2, lng2) => {
    // lat1 用户的纬度 lng1 用户的经度
    // lat2 商家的纬度 lng2 商家的经度
    let radLat1 = Util.Rad(lat1)
    let radLat2 = Util.Rad(lat2)
    let a = radLat1 - radLat2
    let b = Util.Rad(lng1) - Util.Rad(lng2)
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
    s = s * 6378.137
    s = Math.round(s * 10000) / 10000
    s = s.toFixed(1) // 保留两位小数
    if (s < 1) {
      s = s * 1000 + 'm'
    } else {
      s = s + 'km'
    }
    console.log('经纬度计算的距离', s)
    return s
  },
  checkClose: (closestr) => {
    let isClose = false
    let now = new Date().getTime()
    console.log('闭店时间=', closestr)
    let closeArr = closestr.split('-')
    let start = closeArr[0]
    let end = closeArr[1]
    let startArr = start.split(':')
    let endArr = end.split(':')
    let startHour = parseInt(startArr[0])
    let startMinute = parseInt(startArr[1])
    let endHour = parseInt(endArr[0])
    let endMinute = parseInt(endArr[1])
    let nowstr = new Time(now).dateFormat('hh:mm')
    let nowarr = nowstr.split(':')
    let nowHour = parseInt(nowarr[0])
    let nowMinute = parseInt(nowarr[1])
    if (nowHour === startHour) {
      if (nowMinute >= startMinute) {
        isClose = true
      }
    } else if (nowHour === endHour) {
      if (nowMinute <= endMinute) {
        isClose = true
      }
    } else if (startHour >= endHour) {
      if (nowHour >= startHour) {
        isClose = true
      } else if (nowHour <= endHour) {
        isClose = true
      }
    } else {
      if (nowHour > startHour && nowHour < endHour) {
        isClose = true
      }
    }
    return isClose
  }
}

export default Util
