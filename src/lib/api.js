/*
 * api.js Talk to the API.
 * var API = require('api.js')
 *
 * var api = new API({ url: url})
 * var collections = api.getcollections();
 * var collection = api.getcollection('collectionname');
 *
 * var shows = api.getitems(collectionname)
 * var show = api.getitem(collectionname, showname)
 *
 * var movies = api.getitems(collectionname)
 * var movie = api.getitem(collectionname, showname)
 */

import { joinpath } from './util.js'

let objectCache = {}
let requestsPending = {}

export default class API {

  url;

  constructor ({ url }) {
    this.url = url
  }

  getObject (path) {
    if (objectCache[path] !== undefined) {
      return Promise.resolve(objectCache[path])
    }

    let pending = requestsPending[path]
    if (pending !== undefined && pending.length > 0) {
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject })
      })
    }

    let reqUrl = joinpath(this.url, path)
    // console.log('getObj url path req', this.url, path, reqUrl)
    pending = []
    requestsPending[path] = pending
    // console.log('DBG: api.getObject: requesting', reqUrl)

    return new Promise((resolve, reject) => {
      pending.push({ resolve, reject })

      fetch(reqUrl, {
        redirect: 'follow'
      }).then((resp) => {
        if (!resp.ok) {
          throw new RangeError('unexpected HTTP code ' + resp.status)
        }
        // console.log('response:', resp)
        resp.json().then((obj) => {
          objectCache[path] = obj
          while (pending.length > 0) {
            let p = pending.shift()
            p.resolve(obj)
          }
        })
      }).catch((err) => {
        while (pending.length > 0) {
          let p = pending.shift()
          p.reject(err)
        }
      })
    })
  }

  getCollections () {
    return this.getObject('/api/collections')
  }

  getCollection (collName) {
    return this.getObject(joinpath('/api/collection', collName))
  }

  getItems (collName) {
    return this.getObject(joinpath('/api/collection', collName, 'items'))
  }

  getItem (collName, item) {
    return this.getObject(joinpath('/api/collection', collName, 'item', item))
  }

  getShows (collName) {
    return this.getItems(collName)
  }

  getShow (collName, show) {
    return this.getItem(collName, show)
  }

  getMovies (collName) {
    return this.getItems(collName)
  }

  getMovie (collName, movie) {
    return this.getItem(collName, movie)
  }
}
