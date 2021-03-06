'use strict';

/*
* We import our depedencies
*/
var App = require('pdk'),
    _ = require('lodash'),
    helpers = require('./helper-querytorrent'),
    querystring = require('querystring'),
    apiUrl = 'http://yts.wf/api/',
    fingerprint = 'ED:10:DE:CD:19:37:65:7B:FE:71:FC:CB:E3:68:5C:AB:EE:66:01:D0',
    mirror = 'https://yts.sh/api/';

/*
* We build and export our new package
*/
var yts = App.Providers.Source.extend({

    /*
    * Package config
    * as we extend from Providers, we need
    * to set detail for the source.
    */
    config: {
        uniqueId: 'imdb_id',
        tabName: 'YTS',
        type: 'movie', /* should be removed */
        subtitle: 'ysubs',
        metadata: 'trakttv:movie-metadata'
    },

    filters: {
        genres: [
            'All',
            'Action',
            'Adventure',
            'Animation',
            'Biography',
            'Comedy',
            'Crime',
            'Documentary',
            'Drama',
            'Family',
            'Fantasy',
            'Film-Noir',
            'History',
            'Horror',
            'Music',
            'Musical',
            'Mystery',
            'Romance',
            'Sci-Fi',
            'Short',
            'Sport',
            'Thriller',
            'War',
            'Western'
        ],
        sorters: [
            'popularity',
            'date',
            'year',
            'rating',
            'alphabet'
        ],
        types: []
    },

    onActivate: function() {

        console.log(this.imports);

        // we'll check which domain we can use...
        this.checkSSL(apiUrl, fingerprint)
          .then (function () {
            console.log('SSL OK - using ' + apiUrl);
          })
          .catch(function (error) {
            apiUrl = mirror;
            console.log('SSL NOT OK - using ' + apiUrl);
          })
    },

    /*
    * Default Function used by PT
    */
    fetch: function (filters) {

        var params = {};
        params.sort = 'seeds';
        params.limit = '50';

        if (filters.keywords) {
            params.keywords = filters.keywords.replace(/\s/g, '% ');
        }

        if (filters.genre) {
            params.genre = filters.genre;
        }

        if (filters.order) {
            var order = 'desc';
            if (filters.order === 1) {
                order = 'asc';
            }
            params.order = order;
        }

        if (filters.sorter && filters.sorter !== 'popularity') {
            params.sort = filters.sorter;
        }

        if (filters.page) {
            params.set = filters.page;
        }

        var url = apiUrl + 'list.json?' + querystring.stringify(params).replace(/%E2%80%99/g, '%27');

        // Builtin function allowing to query any URL
        // and get results with a promise
        //
        return this.request(url)
            .then(function(data) {
                return helpers.formatForPopcorn(data.MovieList || {});
            });
    },

    /*
    * Default Function used by PT
    */
    detail: function (torrent_id, old_data) {
        var params = {
            imdb_id: torrent_id
        };

        var url = apiUrl + 'listimdb.json?' + querystring.stringify(params).replace(/%E2%80%99/g, '%27');

        return this.request(url)
            .then(function(data) {
                var ptt = helpers.formatForPopcorn(data.MovieList || []);
                var torrents = ptt.results.pop().torrents || {};
                old_data.torrents = _.extend(old_data.torrents, torrents);

                return old_data;
            });
    }

});

module.exports = App.Core.extend({
    onActivate: function() {
        // register our new provider as a source
        this.register(yts);
    }
});
