
'use strict';

const Route = require('restify-loader/route')

module.exports = class Status extends Route {

	init(){

		this.debug( 'Status API' )
	
	}

}