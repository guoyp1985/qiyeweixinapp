import wepy from 'wepy'
import Util from './util'
import Config from '../config'
let cache = {
  app: {
    user: null
  },
  home: {
    homeData: null,
    pagePrev: 0,
    activities: null,
    products: null,
    factoryInfo: null,
    channelInfo: null,
    classes: null
  },
  mark: {
    // pagePrev: 0,
    channelInfo: null,
    products: null,
    settings: null,
    groupsData: null,
    hbMoney: null
  },
  product: {
    list: null
  },
  own: {
    channelInfo: null,
    codemaker: null,
    settings: null
  },
  userView: {
    list: null
  },
  store: {
    list: null,
    products: null,
    activities: null,
    retailer: null,
    classes: null
  },
  newslist: {
    news: null
  },
  addModule: {},
  agent: {
    channelInfo: null
  }
}

const Cached = {
  setPage: (fields, data, timer) => {
    if (!data) return
    fields = fields.split('.')
    const page = fields[0]
    const field = fields[1]
    cache[page][field] = data
    setTimeout(() => {
      cache[page][field] = null
      cache[page].pagePrev = 0
    }, timer)
  },

  getPage: (fields) => {
    fields = fields.split('.')
    const page = fields[0]
    const field = fields[1]
    return cache[page][field]
  },

  setPageQueue: (fields, data, timer) => {
    if (!data) return
    fields = fields.split('.')
    const page = fields[0]
    const field = fields[1]
    const id = parseInt(fields[2])
    let item = {id: id, ...data}
    // if (data.prevPage !== null || data.prevPage !== undefined) {
    //   item.prevPage = data.prevPage
    // }
    let queue = cache[page][field]
    if (Util.isArray(queue)) {
      if (queue.length >= Config.CacheQueueSize) {
        queue.pop()
      }
      console.log(item.data)
      if (Util.isArray(item.data)) {
        let matched = false
        for (let i = 0; i < queue.length; i++) {
          console.log(queue[i])
          console.log(`${id} === ${queue[i].id}`)
          if (id === queue[i].id) {
            queue[i] = item
            matched = true
            console.log(item)
            break
          }
        }
        if (!matched) {
          queue.unshift(item)
        }
      } else {
        queue.unshift(item)
      }
    } else {
      queue = [item]
    }
    cache[page][field] = queue
    setTimeout(() => {
      let cacheQueue = cache[page][field]
      if (Util.isArray(cacheQueue)) {
        for (let i = 0; i < cacheQueue.length; i++) {
          if (cacheQueue[i].id === id) {
            cacheQueue.splice(i, 1)
          }
        }
        console.log(cache[page][field])
      }
    }, timer)
  },

  getPageQueue: (fields) => {
    fields = fields.split('.')
    const page = fields[0]
    const field = fields[1]
    const id = parseInt(fields[2])
    const queue = cache[page][field]
    if (Util.isArray(queue)) {
      console.log(queue)
      for (let i = 0; i < queue.length; i++) {
        if (id === queue[i].id) {
          return queue[i]
        }
      }
    }
    return null
  },

  setPageStorage: (fields, data) => {
    if (!data) return
    wepy.setStorageSync(fields, data)
  },

  getPageStorage: (fields) => {
    const data = wepy.getStorageSync(fields)
    if (data === '' || !data) {
      return null
    }
    return data
  },

  request: (req, fields, timer, cached, response, err) => {
    let cacheData = Cached.getPage(fields)
    if (cacheData) {
      cached(cacheData)
      return new Promise(() => {})
    } else {
      return wepy.request(req).then(
        res => {
          const data = response(res)
          Cached.setPage(fields, data, timer)
        },
        error => {
          err && err(error)
        }
      )
    }
  },

  pagingRequest: (req, fields, timer, cachePaging, cached, response, err) => {
    let cacheData = Cached.getPage(fields)
    if (cacheData && cachePaging(cacheData)) {
      cached(cacheData)
      return new Promise(() => {})
    } else {
      return wepy.request(req).then(
        res => {
          const data = response(res)
          Cached.setPage(fields, data, timer)
        },
        error => {
          err && err(error)
        }
      )
    }
  },

  queueRequest: (req, fields, timer, cachePaging, cached, response, err) => {
    console.log('进入到了取缓存方法')
    console.log(fields)
    let cacheData = Cached.getPageQueue(fields)
    console.log(cacheData)
    if (cacheData && cachePaging(cacheData)) {
      console.log('in 缓存')
      cached(cacheData)
      return new Promise(() => {})
    } else {
      return wepy.request(req).then(
        res => {
          const data = response(res)
          Cached.setPageQueue(fields, data, timer)
        },
        error => {
          err && err(error)
        }
      )
    }
  },

  storageRequest: (req, fields, cached, response, err) => {
    let storageData = Cached.getPageStorage(fields)
    if (storageData) {
      cached(storageData)
      return new Promise(() => {})
    } else {
      return wepy.request(req).then(
        res => {
          const data = response(res)
          Cached.setPageStorage(fields, data)
        },
        error => {
          err && err(error)
        }
      )
    }
  }
}

export default Cached
