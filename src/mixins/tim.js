// tim.js
// BOBO间聊天室mixins
import wepy from 'wepy'
import Config from '@/config'
import Util from '@/libs/util'
import TIM from 'tim-wx-sdk'
// import Config from '@/config'
let usersMap = {}
let tim = TIM.create({SDKAppID: Config.SDKAppID}) // SDK 实例通常用 tim 表示
console.log(tim)
tim.setLogLevel(1)
export default class Tim extends wepy.mixin {
  data = {
    globalData: {},
    userInfo: {},
    messages: [],
    curSysMessage: null,
    messageId: 0,
    messageValue: '',
    memberNum: 0,
    thumbsUps: 0,
    anchor: {},
    live: {},
    livingProduct: null,
    livingCards: [],
    showMembersArea: false,
    members: [],
    switchKey: -1,
    addZan: false,
    isAdmin: false,
    forbidden: false,
    submitingFlag: false,
    fid: Config.Fid
  }
  onLoad (options) {
    console.log(options)
    // this.globalData = this.$parent.globalData
    // this.userInfo = this.$parent.globalData.userInfo
    this.membersPageStart = 0
    this.pageLoading = false
    this.sysMessages = []
    this.wid = this.globalData.wid
    this.liveId = options.lid // BOBO间id，上级页面传递
    this.anchorId = options.aid // 主播id，上级页面传递
    console.log('_________TIM_________TIM_________TIM_________')
    if (this.$parent.globalData.flag.bokaAuth) {
      this.handlePageData()
    } else {
      this.$parent.loadCallback = () => {
        this.handlePageData()
      }
    }
  }
  onUnload () {
    this.setScreenOff()
  }
  async handlePageData () {
    this.globalData = this.$parent.globalData
    Util.appInit(this.globalData)
    this.userInfo = this.globalData.userInfo
    await this.getLiveInfo(this.liveId) // 取BOBO间数据
    if (this.live.moderate === 0 && Number(this.anchorId) !== this.userInfo.uid) {
      wepy.showModal({
        title: '提示',
        content: 'BOBO已结束',
        confirmText: '退出',
        showCancel: false
      }).then(res => {
        if (res.confirm) {
          this.navigateBack()
        }
      })
      return
    }
    this.groupId = this.live.groupid // 取BOBO群id，主播页面会在开播时获取
    console.log('$$$$$$$$$$$$$$$LIVE$$$$$$$$$$$$$$$$$$')
    console.log(this.live)
    this.getAnchor(this.anchorId) // 取主播数据
    this.setMyRights() // 拉取当前登录用户BOBO间角色和状态
    this.timLogin() // 登录TIM，全局一次
    this.timBind() // 消息事件绑定
    this.setScreenOn() // 设置屏幕常亮
    this.handleTimReady() // 重复进入调取TIM数据
  }
  setScreenOn () { // 常亮状态
    wepy.setKeepScreenOn({
      keepScreenOn: true
    })
  }
  setScreenOff () { // 可熄屏状态
    wepy.setKeepScreenOn({
      keepScreenOn: false
    })
  }
  async getLiveInfo (lid) { // 获取BOBO间信息
    const res = await wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/info`,
      data: {id: lid}
    })
    const resData = res.data
    if (resData.flag) {
      const live = resData.data
      this.live = live
      this.thumbsUps = live.dig
      this.$apply()
      console.log(this.thumbsUps)
      this.getLiveProducts(products => {
        for (var i = 0; i < products.length; i++) {
          if (products[i].id === live.liveproduct) {
            this.livingProduct = products[i]
            this.$apply()
            break
          }
        }
      })
      // this.$apply()
      console.log(live)
      return live
    }
  }
  navigateBack () {
    const pages = this.getCurrentPages()
    if (pages.length > 1) {
      wepy.navigateBack()
    } else {
      wepy.navigateTo({url: '/pages/index'})
    }
  }
  handleTimReady (event) { // TIMSDK 就绪回调
    if(this.pageName === 'player') {
      console.log(event)
      if (this.$parent.globalData.timReady || event) { // 排除SDK READY调用时机问题
        this.$parent.globalData.timReady = true
        console.log('---------------READY------------------')
        if (this.groupId && this.groupId !== '') {
          this.joinGroup(this.groupId)
          this.timGroupProfile(this.groupId) // 取当前人数
          // this.timMemberList(this.membersPageStart)
        }
      }
    }
  }
  handleTimReceived (event) { // TIM 消息就绪回调
    console.log('---------------RECEIVED------------------')
    const data = event.data
    for (let i in data) {
      console.log(data[i])
      if (data[i].conversationID === `GROUP${this.groupId}`) { // 过滤会话消息，只显示当前页面会话消息
        const text = this.parseGroupMsg(data[i])
        console.log(`${text}`)
      }
    }
  }
  handleTimKicked (event) { // TIM 被踢回调
    console.log('---------------KICKED------------------')
    this.$parent.globalData.timLogin = false
    // this.$parent.globalData.timBind = false
    this.timUnbind()
    // wepy.showModal({
    //   title: '提示',
    //   content: 'BOBO群已下线',
    //   confirmText: '退出',
    //   showCancel: false
    // }).then(res => {
    //   if (res.confirm) {
    //     this.navigateBack()
    //   }
    // })
    wepy.showToast({title: '聊天室已关闭，无法收发消息', icon: 'none', duration: 3000})
  }
  handleTimNotReady (event) { // TIM 未就绪回调
    console.log('---------------NOT READY------------------')
    this.$parent.globalData.timLogin = false
    // this.$parent.globalData.timBind = false
    this.timUnbind()
    // wepy.showModal({
    //   title: '提示',
    //   content: '数据中断，请重新进入',
    //   confirmText: '退出',
    //   showCancel: false
    // }).then(res => {
    //   if (res.confirm) {
    //     this.navigateBack()
    //   }
    // })
    wepy.showToast({title: '数据未准备好，请重试', icon: 'none', duration: 3000})
  }
  HandleTimError (event) { // TIM 错误回调
    console.log('---------------ERROR------------------')
    // this.$parent.globalData.timLogin = false
    // this.$parent.globalData.timBind = false
    // this.timUnbind()
    // console.error(`${event.name}-${event.data.code}-${event.data.message}`)
    wepy.showToast({title: `${event.name}-${event.data.code}-${event.data.message}`, icon: 'none', duration: 3000})
  }
  timReady () { // TIMSDK 就绪绑定
    tim.on(TIM.EVENT.SDK_READY, this.handleTimReady, this)
  }
  timReceived () { // TIM 消息绑定
    // wepy.showModal({title: 'receive', content: 'ok'})
    tim.on(TIM.EVENT.MESSAGE_RECEIVED, this.handleTimReceived, this)
  }
  timKicked () { // TIM 被踢绑定
    tim.on(TIM.EVENT.KICKED_OUT, this.handleTimKicked, this)
  }
  timNotReady () { // TIM 未就绪绑定
    tim.on(TIM.EVENT.SDK_NOT_READY, this.handleTimNotReady, this)
  }
  timError () { // TIM 错误绑定
    tim.on(TIM.EVENT.ERROR, this.HandleTimError, this)
  }
  timBind () { // 整体TIM事件绑定
    // if (!this.$parent.globalData.timBind) {
    // this.$parent.globalData.timBind = true // 全局绑定一次
    // this.timUnbind()
    console.log(this.$parent.globalData.timBind)
    if (!this.$parent.globalData.timBind) {
      console.log('---------------BIND------------------')
      this.$parent.globalData.timBind = true
      this.timReady()
      this.timReceived()
      this.timKicked()
      this.timNotReady()
      if (Config.DebugMode) {
        this.timError()
      }
    }
    // } else {
    //   this.handleTimReady()
    // }
    // tim.on(TIM.EVENT.MESSAGE_RECEIVED, event => {
    //   // 收到推送的单聊、群聊、群提示以及群系统通知的新消息，可通过遍历 event.data 获取消息列表数据并渲染到页面
    //   // event.name - TIM.EVENT.MESSAGE_RECEIVED
    //   // event.data - 存储 Message 对象的数组 - [Message]
    //   const data = event.data
    //   for (let i in data) {
    //     console.log(data[i])
    //     const text = this.parseGroupMsg(data[i])
    //     console.log(`${text}`)
    //   }
    // })
    //
    // tim.on(TIM.EVENT.CONVERSATION_LIST_UPDATED, event => {
    //   // 收到会话列表更新通知，可通过遍历 event.data 获取会话列表数据并渲染到页面
    //   // event.name - TIM.EVENT.CONVERSATION_LIST_UPDATED
    //   // event.data - 存储 Conversation 对象的数组 - [Conversation]
    // })
    //
    // tim.on(TIM.EVENT.GROUP_LIST_UPDATED, event => {
    //   // 收到群组列表更新通知，可通过遍历 event.data 获取群组列表数据并渲染到页面
    //   // event.name - TIM.EVENT.GROUP_LIST_UPDATED
    //   // event.data - 存储 Group 对象的数组 - [Group]
    // })
    //
    // tim.on(TIM.EVENT.GROUP_SYSTEM_NOTICE_RECEIVED, event => {
    //   // 收到新的群系统通知
    //   // event.name - TIM.EVENT.GROUP_SYSTEM_NOTICE_RECEIVED
    //   // event.data.type - 群系统通知的类型，详情请参见 GroupSystemNoticePayload 的 operationType 枚举值说明
    //   // event.data.message - Message 对象，可将 event.data.message.content 渲染到到页面
    // })
    //
    // tim.on(TIM.EVENT.PROFILE_UPDATED, event => {
    //   // 收到自己或好友的资料变更通知
    //   // event.name - TIM.EVENT.PROFILE_UPDATED
    //   // event.data - 存储 Profile 对象的数组 - [Profile]
    // })
    //
    // tim.on(TIM.EVENT.BLACKLIST_UPDATED, event => {
    //   // 收到黑名单列表更新通知
    //   // event.name - TIM.EVENT.BLACKLIST_UPDATED
    //   // event.data - 存储 userID 的数组 - [userID]
    // })
    //
    // tim.on(TIM.EVENT.ERROR, event => {
    //   // 收到 SDK 发生错误通知，可以获取错误码和错误信息
    //   // event.name - TIM.EVENT.ERROR
    //   // event.data.code - 错误码
    //   // event.data.message - 错误信息
    // })
    //
    // tim.on(TIM.EVENT.SDK_NOT_READY, event => {
    //   // 收到 SDK 进入 not ready 状态通知，此时 SDK 无法正常工作
    //   // event.name - TIM.EVENT.SDK_NOT_READY
    // })
    //
    // tim.on(TIM.EVENT.KICKED_OUT, event => {
    //   // 收到被踢下线通知
    //   // event.name - TIM.EVENT.KICKED_OUT
    //   // event.data.type - 被踢下线的原因，例如 TIM.TYPES.KICKED_OUT_MULT_ACCOUNT 多账号登录被踢
    // })
  }
  timUnbind () { // TIM事件解绑
    tim.off(TIM.EVENT.MESSAGE_RECEIVED, this.handleTimReceived)
    tim.off(TIM.EVENT.SDK_READY, this.handleTimReady)
    tim.off(TIM.EVENT.KICKED_OUT, this.handleTimKicked)
    tim.off(TIM.EVENT.SDK_NOT_READY, this.handleTimNotReady)
    if (Config.DebugMode) {
      tim.off(TIM.EVENT.ERROR, this.HandleTimError)
    }
    this.$parent.globalData.timBind = false
  }
  async timLogin () { // TIM LOGIN
    if (!this.$parent.globalData.timLogin) {
      console.log('---------------LOGIN------------------')
      this.$parent.globalData.timLogin = true // 全局登录一次
      const params = { uid: `${this.userInfo.uid}`, fid: Config.Fid }
      const res = await wepy.request({
        url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/joinLive`,
        data: params
      })
      const data = res.data
      if (data.flag) {
        const promise = tim.login({userID: params.uid, userSig: data.data, fid: this.fid})
        promise.then(imRes => {
          console.log(imRes.data) // 登录成功
        }).catch(imError => {
          console.warn('login error:', imError) // 登录失败的相关信息
        })
      }
    }
  }
  timLogout () { // TIM LOGOUT
    tim.logout()
  }
  // timMsgList (cid) { // TIM 历史消息拉取
  //   // 打开某个会话时，第一次拉取消息列表
  //   // 下拉查看更多消息
  //   const promise = tim.getMessageList({conversationID: cid, count: 20})
  //   promise.then(imResponse => {
  //     const list = imResponse.data.messageList
  //     let msgList = []
  //     console.log(list)
  //     for (let i = 0; i < list.length; i++) {
  //       msgList.push({fromId: list[i].data.from, fromName: list[i].payload.linkman, content: list[i].payload.text})
  //     }
  //     console.log(msgList)
  //     this.messages = imResponse.data.messageList.concat(msgList) // 消息列表。
  //     this.nextReqMessageID = imResponse.data.nextReqMessageID // 用于续拉，分页续拉时需传入该字段
  //     this.isCompleted = imResponse.data.isCompleted // 表示是否已经拉完所有消息
  //     this.messageId = `m${this.messages.length - 1}`
  //     this.$apply()
  //   }).catch(imError => {
  //     console.warn('getMessageList error:', imError) // 获取会话资料失败的相关信息
  //   })
  // }
  async timMsgList () { // TIM 历史消息拉取(注：TIM不支持音视频聊天室拉取历史消息，所以只能通过后台拉取)
    // 打开某个会话时，第一次拉取消息列表
    // 下拉查看更多消息
    console.log('$$$$$$$$$$$$$$$$LIST$$$$$$$$$$$$$$$$$')
    console.log(this.live)
    const params = {groupid: this.live.imgroupsid, pagestart: 0, limit: 20}
    const res = await wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/immessagesList`,
      data: params
    })
    const data = res.data
    if (data.flag) {
      const list = data.data.reverse()
      let msgList = []
      for (let i = 0; i < list.length; i++) {
        msgList.push({fromId: list[i].uid, fromName: list[i].linkman, content: list[i].content})
      }
      console.log('=== msgList ===')
      // console.log(msgList)
      this.messages = msgList.concat(this.messages) // 消息列表。
      // this.messages = msgList
      console.log('=== TIM 历史消息 ===')
      console.log(this.messages)
      this.messageId = `m${this.messages.length - 1}`
      console.log(this.messageId)
      this.$apply()
    }
  }
  timGetConversation (success, failed) {
    const promise = tim.getConversationProfile(`GROUP${this.groupId}`)
    promise.then(imResponse => {
      // 获取成功
      console.log(imResponse.data.conversation) // 会话资料
      success && success(imResponse.data.conversation)
    }).catch(imError => {
      console.warn('getConversationProfile error:', imError) // 获取会话资料失败的相关信息
    })
  }
  timDelConversation (cid) { // TIM 会话销毁
    console.log(cid)
    const promise = tim.deleteConversation(cid)
    promise.then(imResponse => {
      console.log(`deleteConversation ${imResponse.data}`)
      // const { conversationID } = imResponse.data // 被删除的会话 ID)
    }).catch(imError => {
      console.warn('deleteConversation error:', imError) // 删除会话失败的相关信息
    })
  }
  deleteConversation () {
    this.timGetConversation(data => {
      this.timDelConversation(data.conversationID)
    })
  }
  // timMsgRead () {
  //   // 将某会话下所有未读消息已读上报
  //   let promise = tim.setMessageRead(`GROUP${this.groupId}`)
  //   promise.then(imResponse => {
  //     // 已读上报成功
  //   }).catch(imError => {
  //     // 已读上报失败
  //     console.warn('setMessageRead error:', imError)
  //   })
  // }
  timGroupProfile (gid) { // TIM 群信息
    const promise = tim.getGroupProfile({groupID: gid, groupCustomFieldFilter: ['memberNum']})
    promise.then(imResponse => {
      console.log(imResponse.data.group)
      this.memberNum = imResponse.data.group.memberNum
      this.$apply()
    }).catch(imError => {
      console.warn('getGroupProfile error:', imError) // 获取群详细资料失败的相关信息
      wepy.showModal({
        title: '提示',
        content: 'BOBO群已下线',
        confirmText: '退出',
        showCancel: false
      }).then(res => {
        if (res.confirm) {
          this.timUnbind()
          this.navigateBack()
        }
      })
    })
  }
  // parseSysMsg (payload) {
  //   const groupName = payload.groupProfile.groupName || payload.groupProfile.groupID
  //   switch (payload.operationType) {
  //     case 1:
  //       return `${payload.operatorID} 申请加入群组：${groupName}`
  //     case 2:
  //       return `成功加入群组：${groupName}`
  //     case 3:
  //       return `申请加入群组：${groupName}被拒绝`
  //     case 4:
  //       return `被管理员${payload.operatorID}踢出群组：${groupName}`
  //     case 5:
  //       return `群：${groupName} 已被${payload.operatorID}解散`
  //     case 6:
  //       return `${payload.operatorID}创建群：${groupName}`
  //     case 7:
  //       return `${payload.operatorID}邀请你加群：${groupName}`
  //     case 8:
  //       return `你退出群组：${groupName}`
  //     case 9:
  //       return `你被${payload.operatorID}设置为群：${groupName}的管理员`
  //     case 10:
  //       return `你被${payload.operatorID}撤销群：${groupName}的管理员身份`
  //     case 255:
  //       return '自定义群系统通知'
  //   }
  // }
  parseGroupMsg (data) { // TIM 解析消息
    const payload = data.payload
    console.log(data)
    switch (payload.operationType) {
      case TIM.TYPES.GRP_TIP_MBR_JOIN:
        this.showSysMessage(payload.userIDList, '进入BOBO间')
        console.log(data)
        this.timGroupProfile(payload.groupProfile.groupID) // 取当前人数
        break
      case TIM.TYPES.GRP_TIP_MBR_QUIT:
        this.showSysMessage(payload.userIDList, '退出BOBO间')
        this.timGroupProfile(payload.groupProfile.groupID) // 取当前人数
        break
      case TIM.TYPES.GRP_TIP_MBR_KICKED_OUT:
        this.showSysMessage(payload.userIDList, '被请出BOBO间')
        this.timGroupProfile(payload.groupProfile.groupID) // 取当前人数
        break
      case TIM.TYPES.GRP_TIP_MBR_SET_ADMIN:
        this.showSysMessage(payload.userIDList, '成为BOBO助手')
        break
      case TIM.TYPES.GRP_TIP_MBR_CANCELED_ADMIN:
        this.showSysMessage(payload.userIDList, '被撤销BOBO助手')
        break
      default:
        this.showUserMessage(data)
    }
  }
  getAnchor (uid) { // 获取主播信息
    wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/getUser/${uid}`
    }).then(res => {
      const data = res.data
      if (data) {
        this.anchor = data
        this.$apply()
      }
    })
  }
  popSysMessage () {
    if (this.sysMessages.length && !this.popSysTid) {
      this.curSysMessage = this.sysMessages.pop()
      this.$apply()
      this.popSysTid = setTimeout(() => {
        clearTimeout(this.popSysTid)
        this.popSysTid = null
        this.popSysMessage()
      }, 3000)
    } else {
      clearTimeout(this.popSysTid)
      this.popSysTid = null
    }
  }
  showSysMessage (uid, text) { // 显示系统消息
    wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/getUser`,
      data: {uid: uid.join(',')}
    }).then(res => {
      const data = res.data
      if (data.flag) {
        const users = data.data
        let userNames = []
        for (let i = 0; i < users.length; i++) {
          console.log(users[i])
          userNames.push(users[i].linkman)
          usersMap[users[i].uid] = users
        }
        this.sysMessages.push({fromId: 'sys', fromName: '系统提示', content: `${userNames.join(',')} ${text}`})
        // this.messageId = `m${this.messages.length - 1}`
        this.popSysMessage()
        // this.$apply()
      }
    })
  }
  showUserMessage (data) { // 显示用户消息
    console.log(data)
    const type = parseInt(data.payload.data)
    const payload = this.parseMsg(data.payload.description)
    switch (type) {
      case 0: // BOBO结束
        this.live.moderate = 0 // 手动设置状态为结束开播
        wepy.showModal({
          title: '提示',
          content: 'BOBO已结束',
          confirmText: '退出',
        }).then(res => {
          if (res.confirm) {
            this.navigateBack()
          }
        })
        break
      case 1: // 用户消息
        this.messages.push({fromId: data.from, fromName: payload.linkman, content: payload.text})
        this.messageId = `m${this.messages.length - 1}`
        break
      case 2: // 发放优惠券
        console.log(payload)
        this.livingCards = payload
        this.showBenefitArea = true // 打开player优惠券窗口
        break
      case 3: // 商品突出显示
        console.log(payload)
        this.livingProduct = payload
        break
      case 4: // 点赞
        console.log(payload)
        this.thumbsUps += payload.thumbsUp
        break
      case 5: // 禁言
        console.log(payload)
        if (this.userInfo.uid === payload.uid) {
          this.forbidden = payload.forbidden
        }
        for (let i = 0; i < this.members.length; i++) {
          const member = this.members[i]
          if (member.uid === payload.uid) {
            member.state = payload.forbidden ? 1 : 0
          }
        }
        break
      case 6: // 管理员
        console.log(payload)
        this.admin = payload
        if (this.userInfo.uid === this.admin.uid) {
          if (this.admin.isAdmin) {
            wepy.showModal({
              title: '提示',
              content: '你已成为管理员',
              confirmText: '确认',
              showCancel: false
            })
          } else {
            wepy.showModal({
              title: '提示',
              content: '你被取消管理员',
              confirmText: '确认',
              showCancel: false
            })
          }
          this.isAdmin = this.admin.isAdmin
        }
        for (let i = 0; i < this.members.length; i++) {
          const member = this.members[i]
          if (member.uid === this.admin.uid) {
            member.role = this.admin.isAdmin ? 1 : 0
          }
        }
        break
    }
    this.$apply()
  }
  stringifyMsg (msg) { // 格式化消息
    const payload = msg //{uid: this.userInfo.uid, linkman: this.userInfo.linkman, avatar: this.userInfo.avatar, text: msg}
    return JSON.stringify(payload)
  }
  parseMsg (txt) { // 解析消息
    const payload = JSON.parse(txt)
    return payload
  }
  send (type, msg, success, fail, index) { // 发送消息
    console.log(this.groupId)
    if (this.groupId) {
      let message = tim.createCustomMessage({
        to: this.groupId,
        conversationType: TIM.TYPES.CONV_GROUP,
        isRead: true,
        payload: {
          data: type,
          description: this.stringifyMsg(msg)
        }
      })
      const promise = tim.sendMessage(message)
      promise.then(imResponse => {
        console.log(imResponse)
        success && success(message, index)
      }).catch(imError => {
        console.warn('sendMessage error:', imError)
        if (imError.code === 2100) {
          wepy.showModal({
            title: '提示',
            content: '你已被禁言',
            confirmText: '确认',
            showCancel: false
          })
        }
        fail && fail(message, index)
      })
    } else {
      wepy.showToast({title: '未连接到BOBO群，请重试', icon: 'none'})
    }
  }
  joinGroup (gid, success) { // 入群
    console.log(gid)
    const promise = tim.joinGroup({
      groupID: gid,
      type: TIM.TYPES.GRP_AVCHATROOM
    })
    promise.then(imResponse => {
      switch (imResponse.data.status) {
        case TIM.TYPES.JOIN_STATUS_WAIT_APPROVAL: break // 等待管理员同意
        case TIM.TYPES.JOIN_STATUS_SUCCESS: // 加群成功
          console.log(imResponse.data.group) // 加入的群组资料
          this.timMsgList()
          // this.timMsgList(`GROUP${imResponse.data.group.groupID}`) // 拉取群聊记录
          break
        case TIM.TYPES.JOIN_STATUS_ALREADY_IN_GROUP: // 已经在群中
          console.log('-------------拉取群聊记录----------------')
          this.timMsgList()
          // this.timMsgList(`GROUP${gid}`) // 拉取群聊记录
          // this.timGetConversation(() => {
          //   console.log(`GROUP${this.groupId}`)
          //   this.timMsgList(`GROUP${this.groupId}`)
          // })
      }
      success && success()
    }).catch(imError => {
      console.warn('joinGroup error:', imError) // 申请加群失败的相关信息
      wepy.showModal({
        title: '提示',
        content: 'BOBO未开始或已结束',
        confirmText: '返回',
        showCancel: false
      }).then(res => {
        if (res.confirm) {
          this.navigateBack()
        }
      })
    })
  }
  quitGroup () { // 退群
    if (this.groupId) {
      console.log(`${this.groupId} quit group`)
      const promise = tim.quitGroup(this.groupId)
      promise.then(imResponse => {
        console.log(imResponse.data.groupID) // 退出成功的群 ID
      }).catch(imError => {
        console.warn('quitGroup error:', imError) // 退出群组失败的相关信息
      })
    }
  }
  setForbidden (uid, success) { // 设置禁言
    wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/shutUp`,
      data: {type: 'forbid', shutupuid: uid, groupid: this.live.imgroupsid}
    }).then(res => {
      const data = res.data
      if (data.flag) {
        success && success()
        this.send(Config.MSG_TYPE.FORBIDDEN, {uid: uid, forbidden: true})
      }
    })
  }
  cancelForbidden (uid, success) { // 取消禁言
    wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/shutUp`,
      data: {shutupuid: uid, groupid: this.live.imgroupsid}
    }).then(res => {
      const data = res.data
      if (data.flag) {
        success && success()
        this.send(Config.MSG_TYPE.FORBIDDEN, {uid: uid, forbidden: false})
      }
    })
  }
  // forbidden (uid, time, success) {
  //   uid = `${uid}`
  //   let promise = tim.setGroupMemberMuteTime({
  //     groupID: this.groupId,
  //     userID: uid,
  //     muteTime: time // 设为0，则表示取消禁言
  //   })
  //   promise.then(imResponse => {
  //     console.log(imResponse.data.group) // 修改后的群资料
  //     this.send(Config.MSG_TYPE.FORBIDDEN, {uid: uid, forbidden: !time})
  //     success && success()
  //   }).catch(imError => {
  //     console.warn('setGroupMemberMuteTime error:', imError) // 禁言失败的相关信息
  //   })
  // }
  setAdmin (uid, success) { // 设置管理员
    wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/manage`,
      data: {groupid: this.live.imgroupsid, manageruid: uid, type: 'admin'}
    }).then(res => {
      const data = res.data
      if (data.flag) {
        // this.admin(uid, TIM.TYPES.GRP_MBR_ROLE_ADMIN, success)
        success && success()
        this.send(Config.MSG_TYPE.ADMIN, {uid: uid, isAdmin: true})
      }
    })
  }
  cancelAdmin (uid, success) { // 取消管理员
    wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/manage`,
      data: {groupid: this.live.imgroupsid, manageruid: uid, type: 'member'}
    }).then(res => {
      const data = res.data
      if (data.flag) {
        // this.admin(uid, TIM.TYPES.GRP_MBR_ROLE_MEMBER, success)
        success && success()
        this.send(Config.MSG_TYPE.ADMIN, {uid: uid, isAdmin: false})
      }
    })
  }
  // admin (uid, type, success) {
  //   uid = `${uid}`
  //   console.log(`${uid} ::: ${this.groupId}`)
  //   let promise = tim.setGroupMemberRole({
  //     groupID: this.groupId,
  //     userID: uid,
  //     role: type // 将群 ID: group1 中的用户：user1 设为管理员
  //   })
  //   promise.then(imResponse => {
  //     console.log(imResponse.data.group) // 修改后的群资料
  //     this.send(Config.MSG_TYPE.ADMIN, {uid: uid, isAdmin: type === TIM.TYPES.GRP_MBR_ROLE_ADMIN})
  //     success && success()
  //   }).catch(imError => {
  //     console.warn('setGroupMemberRole error:', imError) // 错误信息
  //   })
  // }
  timMemberList (page, success, failed) {
    let promise = tim.getGroupMemberList({
      groupID: this.groupId,
      count: 100,
      offset: 100 * page
    })
    promise.then(imResponse => {
      success && success(imResponse.data.memberList)
      console.log(imResponse.data.memberList)
    }).catch(imError => {
      failed && failed()
      console.warn('getGroupMemberList error:', imError)
    })
  }
  memberList (callback) { // 观众列表
    wepy.showLoading()
    console.log(this.live)
    wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/immembersList`,
      data: {groupid: this.live.imgroupsid, keyword: this.memberSearchKey, pagestart: this.membersPageStart, limit: this.limit},
      method: 'post'
    }).then(res => {
      wepy.hideLoading()
      const data = res.data
      const retdata = data.data ? data.data : data
      callback(retdata)
      this.$apply()
      // if (Util.isString(retdata)) {
      //   this.searchMembers(retdata.split(','), success, failed)
      //   this.pageLoading = false
      //   this.$apply()
      // }
    })
  }
  async memberProfile () {
    const res = await wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/immembersInfo`,
      data: {id: this.live.id, uid: this.userInfo.uid},
      method: 'post'
    })
    if (res) {
      const data = res.data
      if (data.flag) {
        return data.data
      }
    }
  }
  async setMyRights () {
    const profile = await this.memberProfile()
    console.log(profile)
    if (profile.uid === this.userInfo.uid) {
      if (profile.role === 1) {
        this.isAdmin = true
      }
      if (profile.state === 1) {
        this.forbidden = true
      }
      if (profile.isdig === 1) {
        this.addZan = true
      }
    }
    this.$apply()
  }
  // searchMembers (list, success, failed) {
  //   console.log(tim)
  //   let promise = tim.getGroupMemberProfile({
  //     groupID: this.groupId,
  //     userIDList: list,
  //     memberCustomFieldFilter: ['userID', 'avatar', 'nick', 'role', 'muteUntil']
  //   })
  //   promise.then(imResponse => {
  //     success && success(imResponse.data.memberList)
  //   }).catch(imError => {
  //     failed && failed()
  //     console.warn('getGroupMemberProfile error:', imError)
  //   })
  // }
  getLiveProducts (callback) { // BOBO商品列表
    wepy.showLoading()
    let params = {id: this.live.id}
    wepy.request({
      url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/liver/liveProduct`,
      data: params,
      method: 'post'
    }).then(res => {
      wepy.hideLoading()
      const data = res.data
      const retdata = data.data ? data.data : data
      callback(retdata)
      // this.pageLoading = false
      this.$apply()
    })
  }
  setThumbsUp () {
    if (this.submitingFlag) return false
    this.submitingFlag = true
    let params = {module: 'live', id: this.live.id}
    if (!this.addZan) {
      this.addZan = true
      wepy.request({
        url: `${Config.BokaApi}/${Config[Config.ApiVersion]}/user/digs/add`,
        data: params,
        method: 'post'
      }).then(res => {
        const data = res.data
        const retdata = data.data ? data.data : data
        console.log(retdata)
        if (retdata.flag) {
          this.submitingFlag = false
          this.thumbsUps++
          this.send(Config.MSG_TYPE.THUMBSUP, {thumbsUp: 1})
          this.$apply()
        }
      })
    }
  }
  methods = {
    setPanelClose () {
      this.switchKey = -1
    },
    inputMessage (e) {
      this.messageValue = e.detail.value
    },
    sendMessage () {
      if (this.userInfo.subscribe === 0) {
        this.showAuth = true
        this.$apply()
        return false
      }
      const message = {fromId: this.userInfo.uid, fromName: this.userInfo.linkman, content: this.messageValue}
      if (Util.validateQueue(
        [
          {content: message.content}
        ],
        model => {
          switch (model.key) {
            case 'content':
              wepy.showToast({
                title: '请输入消息内容',
                icon: 'none',
                duration: 3000
              })
              break
          }
        }
      )) {
        this.messages.push(message)
        const index = this.messages.length - 1
        this.messageId = `m${index}`
        console.log(this.messageId)
        this.send(Config.MSG_TYPE.NORMAL, {uid: this.userInfo.uid, linkman: this.userInfo.linkman, avatar: this.userInfo.avatar, text: this.messageValue},
          msg => {},
          (msg, index) => {
            const data = JSON.parse(msg.payload.description)
            data.failed = true
            this.messages = this.messages.splice(index, 1, data)
            this.$apply()
          },
          index
        )
        this.messageValue = ''
        this.$apply()
      }
    },
    resendMessage (msg, index) {
      let message = tim.createCustomMessage({
        to: this.groupId,
        conversationType: TIM.TYPES.CONV_GROUP,
        payload: {
          data: Config.MSG_TYPE.NORMAL,
          description: this.stringifyMsg(msg)
        }
      })
      let promise = tim.resendMessage(message) // 传入需要重发的消息实例
      promise.then((imResponse) => {
        // 重发成功
        console.log(imResponse)
        delete msg.failed
        this.messages = this.messages.splice(index, 1, msg)
        this.$apply()
      }).catch((imError) => {
        // 重发失败
        console.warn('resendMessage error:', imError)
        msg.failed = true
        this.messages = this.messages.splice(index, 1, msg)
        this.$apply()
      })
    },
    inputMemberKey (e) {
      this.memberSearchKey = e.detail.value
    },
    cancelMemberSearch () {
      this.memberSearchKey = ''
      this.setData({
        memberSearchKey: ''
      })
      this.membersPageStart = 0
      this.$apply()
      this.memberList(data => {
        this.members = data
      })
    },
    handleMemberSearch () {
      this.membersPageStart = 0
      this.memberList(data => {
        this.members = data
      })
    },
    loadMembersPage () {
      if (!this.pageLoading) {
        if (this.members.length === (this.membersPageStart + 1) * this.limit) {
          this.pageLoading = true
          this.membersPageStart++
          this.memberList(data => {
            this.members = this.members.concat(data)
          })
        }
      }
    },
    handleForbidden (member, index) {
      wepy.showModal({
        title: '提示',
        content: '设为禁言？'
      }).then(res => {
        if (res.confirm) {
          member.state = 1
          this.members.splice(index, 1, member)
          this.$apply()
          this.setForbidden(member.uid)
        }
      })
    },
    handleAdmin (member, index) {
      wepy.showModal({
        title: '提示',
        content: '设为管理员？',
        confirmText: '确定'
      }).then(res => {
        if (res.confirm) {
          member.role = 1
          this.members.splice(index, 1, member)
          this.$apply()
          this.setAdmin(member.uid)
        }
      })
    },
    handleCancelForbidden (member, index) {
      member.state = 0
      this.members.splice(index, 1, member)
      this.$apply()
      this.cancelForbidden(member.uid)
    },
    handleCancelAdmin (member, index) {
      member.role = 0
      this.members.splice(index, 1, member)
      this.$apply()
      this.cancelAdmin(member.uid)
    }
  }
}
