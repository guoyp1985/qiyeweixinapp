const automator = require('miniprogram-automator')
const Home = require('./destiny/home')
describe('home', () => {
  let miniProgram
  let page

  beforeAll(async () => {
    miniProgram = await automator.launch({
      cliPath: '/home/simon/wechat_web_devtools/bin/cli',
      projectPath: '/home/simon/work/gypfactorydev'
    })
    page = await miniProgram.reLaunch('/pages/home')
    await page.waitFor(500)
  }, 60000)

  afterAll(async () => {
    await miniProgram.close()
  })

  it('toparea desc', async () => {
    const topArea = await page.$('.toparea')
    const userName = await topArea.$('.bold')
    const userAvatar = await topArea.$('image')
    const wxNumber = await topArea.$('.mt5 view')
    const sellerUser = (await page.data()).$homeUser$sellerUser
    expect(await userName.text()).toBe(Home.userName)
    expect(await userAvatar.attribute('src')).toBe(Home.userAvatar)
    // expect(await wxNumber.text()).toContain(Home.wxNumber)
    // expect(sellerUser.shoukuanma).toBe(Home.qrCode)
  })

  // it('toparea qr action', async () => {
  //   const userInfo = (await page.data()).userInfo
  //   const { errMsg } = await miniProgram.callWxMethod('previewImage', {
  //     current: 0,
  //     urls: [userInfo.shoukuanma]
  //   })
  //   console.log(userInfo.shoukuanma)
  //   expect(userInfo.shoukuanma).toMatch(/\S/)
  //   expect(errMsg).toContain('previewImage:ok')
  // })

  it('product list', async () => {
    for (let i = 0; i < 10; i++) {
      await miniProgram.pageScrollTo(2000 * (i + 1))
      const list = await page.$$('.product-list .scroll_item')
      expect(list.length).toBe(Home.listNum * (i + 1))
      await page.waitFor(1000)
    }
  })
})
