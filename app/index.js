'use strict'



// Settings:
const PORT = process.env.PORT || 9090
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const CONCURRENT_JOBS = process.env.CONCURRENT_JOBS || 1



// Modules:
const colors = require('colors')
const kue = require('kue')



// Create KUE queue:
let queue = kue.createQueue({
	redis: REDIS_URL
})



// REST API Server:
let server = require('restify-loader')({
	dir: __dirname,
	name: 'cuid-runner',
	version: '1.0.0',
	dirs: {
		libs: 'libs',
		executors: 'executors'
	},
	// raven: {
	// 	context: {
	// 		ENV: process.env.ENVIRONMENT || "localhost"
	// 	},
	// 	DSN: process.env.SENTRY_DSN || 'DSN_KEY',
	// },
})



// Start the Scheduler and Runner:
server.Runner = new server._dirs.libs.runner( server, queue, CONCURRENT_JOBS )



// Listen for connections:
server.listen(PORT, () => {
	console.log(`Listening to port: ${PORT}`.good)
})



// Graceful Shutdown of current executors:
process.once( 'SIGTERM', ( sig ) => {
	console.log('GOT SIGTERM. WAITING ON ACTIVE ITEMS ( 5s )')
	queue.shutdown( 5000, ( err ) => {
		console.log( 'Kue shutdown: ', err || '' )
		process.exit( 0 )
	})
})