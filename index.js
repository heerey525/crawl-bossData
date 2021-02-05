const express = require('express')
const app = express()
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const db = require('./db/connect') // 链接数据库
const BossModel = require('./db/model/bossModel') // 引入bossModal

const bodyParser = require('body-parser') //用于req.body获取值的
app.use(bodyParser.json())
// 创建 application/x-www-form-urlencoded 编码解析
app.use(bodyParser.urlencoded({ extended: false }))

let browser,page
  // puppeteer新打开一个浏览器窗口
;(async () => {
  browser = await puppeteer.launch({
    headless: false,
    // args: ['--start-maximized'],
  })
  page = await browser.newPage()
  // await page.emulate(puppeteer.devices['iPhone X'])
  // await page.goto('https://www.baidu.com')
  await page.setViewport({width:1920,height:1080}); // 设置浏览器窗口大小
  //   let cookie = await page.evaluate(() => document.cookie) // 获取cookie
  //   await page.screenshot({ path: 'full.png', fullPage: true }) // 截图保存
  //   await browser.close(); // 浏览器关闭
})()
// 爬取接口
app.get('/boss', async (req, res) => {
  const { pageNo } = req.query
  if (!pageNo) return res.send({ code: 500, msg: '失败' })
  // 这里默认爬取的是前端相关，可以修改为其他搜索条件下的url
  await page.goto(
    `https://www.zhipin.com/c100010000/?query=%E5%89%8D%E7%AB%AF&page=${pageNo}&ka=page-${pageNo}`,
    { timeout: 0 }
  )
  // 获取到工作列表区域
  let contentDom = await page.$eval('#main', (e) => e.innerHTML)
  // 将工作列表区域的Dom处理
  let content = await getBossDatas(contentDom)
  if (!content.length) return res.send({ code: 500, msg: 'boss数据爬取失败' })
  // 将处理好的数据存入MongoDB数据库
  BossModel.insertMany(content)
    .then(() => {
      res.send({ code: 200, msg: 'boss数据爬取保存成功' })
    })
    .catch((err) => {
      res.send({ code: 500, msg: 'boss数据爬取保存失败: ' + err })
    })
})

// 处理爬取的数据
const getBossDatas = async (text) => {
  /* 使用cheerio模块的cherrio.load()方法，将HTMLdocument作为参数传入函数
       以后就可以使用类似jQuery的$(selectior)的方式来获取页面元素
     */
  let $ = cheerio.load(text)
  let bossDatas = []

  // 找到目标数据所在的页面元素，获取数据
  $('div.job-box div.job-list ul li div.job-primary').each((idx, ele) => {
    const company = $(ele).find('.info-company .company-text .name').text()
    const job_title = $(ele)
      .find('.info-primary .primary-box .job-title .job-name')
      .text()
    const salary = $(ele).find('.info-primary .job-limit .red').text()

    const description = $(ele).find('.info-primary p').text()
    const area = $(ele)
      .find('.info-primary .primary-box .job-title .job-area-wrapper .job-area')
      .text()
    const href =
      'https://www.zhipin.com' +
      $(ele).find('.info-primary .primary-box').attr('href')
    const item = {
      company: company,
      job_title: job_title,
      salary: salary,
      description: description,
      area: area,
      href: href,
    }
    bossDatas.push(item)
  })
  return bossDatas
}

// 测试接口：插入数据库  { company：'公司名', job_title: '职位标题', salary: '薪资范围', description: '职位描述', area: '公司位置', href: '职位详情地址' }
app.post('/add', (req, res) => {
  BossModel.create(req.body)
    .then(() => {
      res.send({ code: 200, msg: '新增boss数据成功' })
    })
    .catch((err) => {
      res.send({ code: 500, msg: '新增boss数据失败: ' + err })
    })
})

/**
 * @api {post} /list 从数据库获取boss数据
 * @apiName 从数据库获取boss数据
 * @apiGroup boss
 *
 * @apiParam {Number} pageNo 页数
 * @apiParam {Number} pageSize 条数
 * @apiParam {Number} key 模糊查询（公司|位置）
 */
app.post('/list', (req, res) => {
  const pageNo = Number(req.body.pageNo) || 1
  const pageSize = Number(req.body.pageSize) || 10

  const { key } = req.body
  const reg = new RegExp(key)
  const query = {
    $or: [{ company: { $regex: reg } }, { area: { $regex: reg } }],
  }
  // 获取符合条件的数据总数
  BossModel.countDocuments(query, (err, count) => {
    if (err) {
      res.send({ code: 500, msg: '获取boss数据失败：' + err })
      return
    }
    // 获取符合条件的数据
    BossModel.find(query)
      .skip(pageSize * (pageNo - 1))
      .limit(pageSize)
      .then((data) => {
        res.send({
          code: 200,
          data,
          total: count,
          pageNo: pageNo,
          pageSize: pageSize,
          msg: '获取boss数据成功',
        })
      })
      .catch(err => {
        res.send({ code: 500, msg: '获取boss数据失败：' + err })
      })
  })
})

let server = app.listen(3003, function () {
  const port = server.address().port
  console.log('Your App is running at http://localhost:' + port)
})
