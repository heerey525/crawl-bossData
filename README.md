# crawl-bossData

#### 介绍
用node的puppeteer，模拟真实操作爬取boss zhipin的数据，并存入MongoDB数据库

#### 软件架构
基于express和Puppeteer的Node库，实现模拟打开Chrome浏览器，并通过代码和鼠标操作

#### 安装教程
`npm install`

#### 使用说明
1.  启动mongoDB（在安装好MongoDB之后，利用add接口插入一条数据的同时创建了数据集合）
2.  `node index.js` 启动项目，默认端口3003
3.  调用接口 http://localhost:3003/boss?pageNo=1 爬取boss zhipin关于前端的第一页，爬取成功。然后鼠标模拟在浏览器上下滑动或点击详情（旨在模拟真实使用）
4.  之后修改接口pageNo参数为2 http://localhost:3003/boss?pageNo=2 继续爬取第2页，然后鼠标模拟在浏览器上下滑动或点击详情（旨在模拟真实使用）
5.  如4 爬取第3页等等

