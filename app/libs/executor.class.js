'use strict'


// Modules:
const EventEmitter = require('events')
let lodash = require('lodash')


// Executor
module.exports = class Executor extends EventEmitter {

	constructor( job, globalEvents, callback ){
		// Extend the EventEmitter:
		super()

		this.debug = require('debug')( `cuid:executor:${job.data.type}` )

		// Attach params
		this.events = globalEvents
		this.job = job
		this.data = job.data
		this.meta = job.data.meta
		this.executorMeta = job.data.meta.executor || {}
		this.callback = callback

		// Log some stuff:
		this.debug( `[new] Executor Created ( ${job.data.type} )`.good )
		this.job.log( `Executor Created Successfully` )

		this.init()
		
	}

	error( err ){
		this.debug( 'ERROR:'.error, err.json )
		this.job.log( 'ERROR:', err )
		this.callback( JSON.stringify( err ) )
	}

	done( msg ){
		this.debug( 'DONE'.good, msg )
		this.job.log( 'DONE', msg )
		this.callback( null, msg )
	}

	init(){
		this.debug( 'Route Initialized ( Your route class should overwrite this init function )'.warn )
	}

}