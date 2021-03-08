const ExtConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {}
const Config = {
  DebugMode: false, // 输出调试，正式环境不需要配置
  version: ExtConfig.version ? ExtConfig.version : '1.0.0.1',
  AppName: ExtConfig.appName ? ExtConfig.appName : '共销汇',
  WeixinName: ExtConfig.appName,
  AppId: ExtConfig.appId ? ExtConfig.appId : 'wx9f7339af150e0b6f', // 博卡供销社 wx9f7339af150e0b6f
  // AppId: ExtConfig.appId ? ExtConfig.appId : 'wx1b22fe75584085ee', // 灰太狼 wx1b22fe75584085ee
  // AppId: ExtConfig.appId ? ExtConfig.appId : 'wx72131ab2cb77663d', // 共销汇 wx72131ab2cb77663d
  // AppId: ExtConfig.appId ? ExtConfig.appId : 'wxd0e66d0c646cb8a9', // 柽柽哥 wxd0e66d0c646cb8a9
  AppLogo: ExtConfig.appLogo,
  FeedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  BokaApi: ExtConfig.bokaApi ? ExtConfig.bokaApi : 'https://qy.boka.cn',
  GxkApi: ExtConfig.gxkApi ? ExtConfig.gxkApi : 'https://laravel.boka.cn',
  WebViewApi: ExtConfig.webViewUrl ? ExtConfig.webViewUrl : 'https://vue.boka.cn',
  AdminApi: ExtConfig.adminApi ? ExtConfig.adminApi : 'http://laravelcms.boka.cn', //http://laravelcms.boka.cn // http://sharingadmin.boka.cn
  StoreHome: ExtConfig.storeHome,
  SourceFid: ExtConfig.sourceFid ? ExtConfig.sourceFid : 105, // 托管厂家的fid，开发版 105 鲲鹏 ，正式版 73 博卡先锋
  Fid: ExtConfig.fid ? ExtConfig.fid : 39, // 共销汇 101, 灰太狼 39, 柽柽哥 61, 晚八 78
  Wid: ExtConfig.wid ? ExtConfig.wid : 14,
  GxkAppId: ExtConfig.gxkAppId ? ExtConfig.gxkAppId : 'wx52f62bbdcf1ee04f', // 共销客: wx1d33c39033d3f785, 开发版共销客: wx52f62bbdcf1ee04f
  Accept: ExtConfig.Accept ? ExtConfig.Accept : 'application/vnd.factorydev.v2+json',
  HqAppId: 'wx018f0c4c2a1ee727',
  // HomePage: '/pages/index',
  HomePage: '/pages/qyshop',
  V1: 'api',
  V2: ExtConfig.appId ? 'api/' + ExtConfig.appId : 'api/wx1b22fe75584085ee',
  ApiVersion: ExtConfig.ApiVersion ? ExtConfig.ApiVersion : 'V1',
  ApiAccept: 'application/vnd.factorydev.v2+json',
  SDKAppID: 1400278262,
  SDKAppKey: '876ebd2200356a8e1e6020566f46f01125804dd278d357d5dde76739a3ed635e',
  AllowWxgroups: true,
  Router: {
    channel: 'package/pages/channel',
    factoryproduct: 'pages/product',
    product: 'pages/product',
    fpimport: 'pages/product',
    store: 'packageB/pages/store',
    news: 'packageB/pages/news',
    factorynews: 'packageB/pages/news',
    newslist: 'packageB/pages/newslist',
    addmodule: 'pages/addModule',
    service: 'package/pages/customerList',
    share: 'packageD/pages/userShare',
    invite: 'pages/vip',
    refundorders: 'packageC/pages/orders'
  },
  Limit: 10,
  MiniAppArr: [
    {appid: 'wx018f0c4c2a1ee727', title: '和群'},
    {appid: 'wx52f62bbdcf1ee04f', title: '开发版共销客'}
  ],
  ShowMaterial: true,
  ShowUploader: true,
  ShowChat: false,
  BackgroundColor: '#F25D5D',
  FrontColor: '#ffffff',
  URT: {
    H: 60000,
    M: 600000,
    L: 3600000,
  },
  CacheQueueSize: 10,
  AdminUids: {
    96: [1, 2, 1406]
  },
  AdminAppid: 'wx72131ab2cb77663d,wx7ce62088102d5b2f',
  CommissionFactory: {
    'wx5e54510dc895bd71': true // 博卡plus，只有该小程序的配置是true
  }, // 邀请厂家分佣的小程序
  QrcodeBg: 'https://tossharingsales.boka.cn/minigxk/share_bg.png',
  FactoryInvite: false,
  KefuQrcode: 'https://tossharingsales.boka.cn/images/kefu_qrcode.jpg',
  QQTQrcode: 'https://tossharingsales.boka.cn/minigxk/factory/QQTKefu.jpg',
  KefuWxNo: 'sharingsales',
  Help: {
    news: 14, // 文章获客
    groups: 15, // 微信群获客
    activity: 16, // 活动获客-公众号活动
    training: 17, // 培训获客
    friends: 18, // 朋友圈获客
    miniactivity: 19, // 群活动-小程序活动
    groupTraining: 20, // 群培训
    product: 21, // 我的商品
    store: 22, // 我的店铺
    promotion: 23, // 促销活动
    retailerOrders: 24, // 订单管理-卖家订单
    addKouling: 27, // 添加口令红包
    addVoucher: 28, // 添加全员抢券
    addAnswer: 29, // 添加答题活动
    addFacehongbao: 30, // 添加趣味红包
    myFactory: 31, // 我的厂家
    mySales: 33, // 我的返点客
    qun: 34, // 群群推
    help: 14 // 厂家分佣
  },
  TestWids: [16, 40, 4903],
  MSG_TYPE: {
    END: '0', // BOBO结束
    NORMAL: '1', // 普通消息
    BENEFIT: '2', // 发优惠券
    PRODUCT: '3', // BOBO商品
    THUMBSUP: '4', // 点赞
    FORBIDDEN: '5', // 禁言
    ADMIN: '6' // 设管理员
  },
  SpecialChannelId: 244, // 特殊处理合伙人页面模块的跳转
  NavAppId: 'wx1b22fe75584085ee', // 跳转小程序 灰太狼
  // AllowNavApp: true
  AllowNavApp: (ExtConfig.appId == 'wx72131ab2cb77663d' || ExtConfig.appId == 'wx93366404c4cbc761') ? true : false, // 共销汇和海囤生活做跳转,做用户合并
  BoboAppIds: {
    'wx72131ab2cb77663d': true
  }, // 可以显示内测和BOBO功能的小程序，共销汇
  // MenuData: [
  //   {id: 1, title: '商城', module: 'home', type: '0', miniprogramurl: '/pages/home'},
  //   {id: 2, title: '我的', module: 'own', type: '0', miniprogramurl: '/pages/own'}
  // ],
  MenuData: [
    {id: 1, title: '首页', module: 'home', type: '0', miniprogramurl: '/pages/qyshop'},
    {id: 2, title: '购物车', module: 'shop', type: '0', miniprogramurl: '/packageC/pages/cart'},
    {id: 2, title: '订单', module: '', type: '0', miniprogramurl: '/packageD/pages/userOrders'},
    {id: 3, title: '我', module: 'own', type: '0', miniprogramurl: '/pages/own'}
  ],
  OrderHomeShare: 'https://tossharingsales.boka.cn/minigxk/shxd.png',
  CardClassID: 29,
  CreateOrderUser: {
    'wx1b22fe75584085ee': { // 灰太狼
      regwid: {4903: true, 48852: true, 115800: true, 115838: true} //gyp,Reluctantly,风偏,嗯
    },
    'wxcfb6a24abcabc9f9': { // 楚风优选
      fuid: {1209032: true, 683639: true}, // 楚风优选,楚风导师
      regwid: {44: true, 4903: true, 8: true} // 楚风越韵,gyp,young
    }
  },
  ContactPluginID: 'cd23f2bb207cb7ee3a8765dd80b52db3' // 在企业微信管理后台配置的唯一插件ID  dd14b023deed2e3530096276caa9a52e
}

Config.FilterUrls = [
  Config.BokaApi + '/api/miniLoginU/*',
  Config.BokaApi + '/api/user/miniUpdateU'
]

console.log('进入到了配置文件')
console.log(ExtConfig)

export default Config
