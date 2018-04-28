const got = require('got')
// const Keyv = require('keyv')
// const KeyvRedis = require('@keyv/redis')
// const redis = new KeyvRedis('redis://user:pass@localhost:6379')
const redis = new Map() // fake Redis for now

const discord = require('discord.js')
const embed = new discord.RichEmbed()

const humanFormat = require('human-format')
const COLOR = 0xe1e818

exports.name = 'field'
exports.aliases = []
exports.level = 0
exports.command = async function(client, message) {
  const args = message.content.split(' ')

  let response = await got('https://field.carriota.com/api/v1/graph', {
    cache: redis,
    json: true
  })
  const graph = response.body
  response = await got('https://field.carriota.com/api/v1/stats', {
    cache: redis,
    json: true
  })
  const stats = response.body
  if (!args[1]) {
    sendStats(graph, stats, message)
  } else {
    const query = args[1]
    if (query.length < 3) {
      return message.channel.send(
        'Your query is too short, try again with longer query'
      )
    }
    const nodes = graph.filter(node => node.field.name.includes(query))
    if (nodes.length > 3) {
      return message.channel.send(
        'More than 3 nodes found, try again with longer query'
      )
    }
    nodes.forEach(node => {
      sendNode(node, message)
    })
  }
}

function sendStats(graph, stats, message) {
  const nodesCount = graph.length
  const embed = new discord.RichEmbed()
  embed.addField('FIELD NODES ONLINE:', nodesCount)
  embed.addField(
    'TXS PROMOTED / ATTACHED:',
    humanFormat(stats.autoAttacher.done)
  )
  embed.addField('TOTAL IOTAS DONATED:', humanFormat(stats.totalDonated))
  embed.addField('IOTAS TRANSFERRED:', humanFormat(stats.totalTransferred))
  embed.setTimestamp()
  embed.setColor(COLOR)
  message.channel.send('', { embed })
}

function sendNode(node, message) {
  const embed = new discord.RichEmbed()
  embed.setTitle(`Field node ${node.field.publicId}, ${node.field.name} `)
  embed.addField('IRI Enabled?:', `${node.field.disableIRI == false}`)
  embed.addField('IRI Version:', `${node.iri.appVersion}`)
  embed.addField(
    'Synced?:',
    `${node.iri.isSynchronized} ${node.iri.latestMilestoneIndex}/${
      node.iri.latestSolidSubtangleMilestoneIndex
    }`
  )
  embed.addField('Field Version:', node.field.version)
  embed.addField('Neighbors:', node.neighbors.length)
  embed.setTimestamp()
  embed.setColor(COLOR)
  message.channel.send('', { embed })
}

// Clear cache after 10 min
setInterval(() => {
  redis.clear()
}, 1000 * 60 * 10)
