'use strict'


const EventEmitter = require('events')
let lodash = require('lodash')
const debug = require('debug')('cuid:runner')


module.exports = class Runner extends EventEmitter {

	constructor( server, queue, CONCURRENT_JOBS ){
		// Extend the EventEmitter:
		super()
		let self = this

		this.executors = {}
		this.queue = queue
		this.events = server._events
		this.server = server
		this.CONCURRENT_JOBS = CONCURRENT_JOBS
		debug( '[new] runner'.good )
		this.listenOnQueue()
		
	}

	listenOnQueue(){
		debug( 'listening on queue'.info )
		this.queue.process( 'job', this.CONCURRENT_JOBS, this.createExecutor.bind( this ) )
	}

	createExecutor( job, callback ){
		debug( `Got Job ${job.id}/${job.data.name} creating executor ( ${job.data.type} )`.debug )
		job.log( `Job ${job.data.name} accepted` )
		this.executors[ job.id ] = new this.server._dirs.executors[ job.data.type ]( job, this.events, callback )
	}

}