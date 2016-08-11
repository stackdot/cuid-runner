
'use strict';


// Params
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock'


// Modules:
const Executor = require('./../libs/executor.class.js')
const DockerLib = require('dockerode')
const lodash = require('lodash')
const Stream = require('stream')
const Q = require('q')
const fs = require('fs')



// Executor
module.exports = class Docker extends Executor {

	init(){

		this.debug( 'Start running Docker Task'.good )

		// Check docker is working:
		let stats = fs.statSync( DOCKER_SOCKET )
		if(!stats.isSocket()) return this.error( 'DOCKER ISNT RUNNING ( Check the socket )' )

		// Create docker connection:
		this.docker = new DockerLib({
			socketPath: DOCKER_SOCKET
		})

		// Execute the task:
		this.job.log( 'Docker connection made' )
		this.job.progress( 1, 5 )
		this.pullImage()
			.then( this.runImage.bind( this ) )
			.then( this.updateRecords.bind( this ) )
			.catch( this.error.bind( this ) )

	}


	writeStream(){
		let self = this
		return Stream.Writable({
			write: ( chunk, encoding, next ) => {
				const str = chunk.toString()
				lodash.each( str.split(/\r|\n/), ( s ) => {
					if( !lodash.isEmpty( s ) ){
						self.job.log( s )
						self.debug( s.info )
					}
				})
				next()
			}
		})
	}


	updateRecords(){
		this.job.progress( 5, 5 )
		this.done( '[Docker Completed]' )
	}


	runImage(){
		this.job.log( 'Running the docker image' )
		this.job.log( '-------------------------' )
		this.debug( `Running the docker image ${this.executorMeta.image}`.debug )

		const deferred = Q.defer()

		this.docker.run(
			this.executorMeta.image,
			lodash.flatten([this.executorMeta.cmd]),
			this.writeStream(),
			{},
			( err, data ) => {
				if(err) return deferred.reject( err )
				this.job.log( '-------------------------' )
				this.job.log('[Container Done]')
				this.job.progress( 4, 5 )
				deferred.resolve( data )
			}
		)

		return deferred.promise

	}


	pullImage(){

		const deferred = Q.defer()

		let options = {}
		if( this.executorMeta.auth ){
			this.debug( 'Has auth'.info )
			options.authconfig = {
				username: this.executorMeta.auth.user,
				password: this.executorMeta.auth.password,
				email: this.executorMeta.auth.email,
				serveraddress: this.executorMeta.auth.registry
			}
		}

		this.job.log( 'Pulling image from registry...' )
		this.debug( `Pulling image: ${this.executorMeta.image}`.debug )
		this.docker.pull( this.executorMeta.image, options, ( err, stream ) => {
			if(err) return deferred.reject( err )

			this.job.progress( 2, 5 )

			function onFinished( err, output ){
				this.debug( `Image Finished Pulling`.debug )
				if(err) return deferred.reject( err )
				this.job.log('Done pulling image')
				this.job.progress( 3, 5 )
				deferred.resolve( output )
			}

			function onProgress(event){
				this.debug( `progress ${event.status}`.info )
				this.job.log( event.status )
			}

			this.docker.modem.followProgress( stream, onFinished.bind( this ), onProgress.bind( this ) )

		})

		return deferred.promise

	}

}