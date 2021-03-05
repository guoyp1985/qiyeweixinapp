const ExtConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {})
const Config = {
  WeixinName: ExtConfig.appName,
  AppId: ExtConfig.appId,
  AppLogo: ExtConfig.appLogo,
  FeedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  BokaApi: ExtConfig.bokaApi, //'https://gxb.boka.cn',//'http://laravel.boka.cn', // test: http://124.207.246.107 // vux: http://vuxserver.boka.cn
  SocketBokaRoom: ExtConfig.socketBokaRoom,
  SocketServer: ExtConfig.socketServer, // vux: 'ws://123.206.77.217:7272', // vue: 'ws://124.207.246.109:7272'
  WebViewApi: ExtConfig.webViewUrl,
  StoreHome: ExtConfig.storeHome,
  OrderStatus: [
    {id: 0, status: '订单取消'},
    {id: 1, status: '已确认订单'},
    {id: 2, status: '待发货'},
    {id: 3, status: '已发货'},
    {id: 4, status: '已确认收货'},
    {id: 100, status: '已完成'}
  ]
}

export default Config
