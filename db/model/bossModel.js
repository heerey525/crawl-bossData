const mongoose = require('mongoose')
var Schema = mongoose.Schema

var bossSchema = new Schema({
  company: { type: String, required: true }, // 公司名称
  job_title: { type: String, required: true }, // 职位描述
  salary: { type: String, required: true }, // 工资
  description: { type: String, required: true }, // 描述
  area: { type: String, required: true }, // 位置
  href: { type: String, required: true }, // 链接
})

var BossModel = mongoose.model('bosss', bossSchema)

module.exports = BossModel
