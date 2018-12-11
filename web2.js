/**
 * Created by Superjo149 on 27/05/2015.
 */
(function () {

    var options;
    var defaults = {
        api_key: null,
        staff: [],
        tickets: {
            preset_id: null
        },
        news: {
            preset_id: null,
            page: 1
        },
        tags: {
            page: 1
        },
        debug:false,

    };
    var url = function () { // TODO add support for HTTPS
        /*if (location.origin.indexOf(".enjin.com") > -1) {
         return location.origin.replace('http:', 'https:') + url;
         }*/
        return "/api/v1/api.php";
    };
    var api_id = Math.round(Math.random() * (999999 - 100000) + 100000);
    var user_id = (current_session_user_id) ? current_session_user_id : null;
    var site_id = (Enjin_Core) ? Enjin_Core.site_id : null;


    var user = null;
    var tag_types = null;
    var all_tags = null;

    this.errors = {
        1: "If you want to check if a user is staff, you need to specify your staff first!",
        2: "{r} is required",
        3: "function {r} requires you to specify an API key",
        4: "{r} can't be 0 or less",
        5: "Incorrect token",
        6: "A preset_id is required for {r}"
    };

    /**
     * Enjin API Helper plugin
     *
     * @version 0.0.1
     * @constructor
     * @namespace EnjinAPIHelper
     */
    this.EnjinAPIHelper = {
        /**
         * Initialize the helper, include this at the top of your page if you require an API key, staff or other default settings.
         *
         * @param {Object} settings
         * @param {String} [settings.api_key] - Your site's API key with the en abled methods you want to use
         * @example <caption>API key</caption>
         * EnjinAPIHelper.init({
         *  "api_key": "7625b355f37f45b19e89812a02ec2f0a344665c50e2e1492"
         * });
         *
         * @param {(int[]|String[])} [settings.staff] - The ranks you want to consider staff, you can use both the actual rank name or the rank id.
         * @example <caption>Staff</caption>
         * EnjinAPIHelper.init({
         *  "staff": ["Owner",565842]
         * });
         *
         * @param {Object} [settings.tags] -
         * @param {int} [settings.tags.page=1] - Default page for tag requests
         * @example <caption>Tags Page</caption>
         * EnjinAPIHelper.init({
         *  "tags": {
         *      "page": 1
         *  }
         * });
         *
         * @param {Object} [settings.news] -
         * @param {int} [settings.news.preset_id=null] - Module preset_id
         * @param {int} [settings.news.page=1] - Default page for tag requests
         * @example <caption>News</caption>
         * EnjinAPIHelper.init({
         *  "news": {
         *      "preset_id":"10826",
         *      "page": 1
         *  }
         * });
         *
         * @memberof EnjinAPIHelper
         * @method init
         */
        init: function (settings) {
            if (settings && typeof settings === "object") {
                options = extendDefaults(defaults, settings);
            }

            if (site_id && options.debug) {
                var style = "body > .user_tray .growls{ \
                    width:500px \
                    } \
                    .EnjinAPIHelper_growl{ \
                        padding:5px 10px !important; \
                    } \
                    .EnjinAPIHelper_growl.error:before{ \
                        color:#c0392b !important; \
                        content:'EnjinAPIHelper:'; \
                        font-weight:bold; \
                    }";

                $('body').append("<style>" + style + "</style>");

            }
        },

        /**
         * Point methods
         *
         * @memberof EnjinAPIHelper
         * @type {object}
         * @namespace EnjinAPIHelper.points
         */
        points: {

            /**
             * Get a user's points (Points.get) - If you give it a parameter, it will get that user's points. Otherwise it will get the points from the currently logged in user
             *
             * @param {(int|String)} [user] - user_id (int) or MC player name (String) (If you don't give it a parameter, it will use the logged in user.)
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example
             * // Example data
             * {
             *  username:"Superjo149",
             *  user_id: 4158534,
             *  current_points: 50
             * }
             * @example <caption>Sync request</caption>
             * var points = EnjinAPIHelper.points.get("Superjo149"); // points = 50
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.points.get("Superjo149",function(data){
             *  var points = data; // points = 50
             * });
             *
             * @returns {int} points - Number of point's a user has
             */
            get: function (user, callback) {
                var method = "Points.get";

                var param = {};

                if (user) {
                    if (typeof user == 'string' || user instanceof String) {
                        param.player = user;
                    } else {
                        param.user_id = user;
                    }
                }

                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(checkData(data));
                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }
            },

            /**
             * Set a user's points (Points.set)
             *
             * @param {(int|String)} user - user_id (int) or MC player name (String) (If you don't give it a parameter, it will use the logged in user.)
             * @param {int} points - Number of points to set for the user
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example
             * // Example data (this is not the output, it's data just for this example)
             * {
             *  username:"Superjo149",
             *  user_id: 4158534,
             *  current_points: 50
             * }
             * @example <caption>Sync request</caption>
             * var new_points = EnjinAPIHelper.points.set("Superjo149",90); // new_points = 90
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.points.get("Superjo149",90,function(data){
             *  var new_points = data; // new_points = 90
             * });
             *
             * @returns {int} points - New point balance
             */
            set: function (user, points, callback) {
                var method = "Points.set";

                if (!points) return throwError(2, "points");
                if (!user) return throwError(2, "parameter 1");

                var param = {
                    points: points
                };

                if (user) {
                    if (typeof user == 'string' || user instanceof String) {
                        param.player = user;
                        param.user_id = false;
                    } else {
                        param.user_id = user;
                    }
                }

                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(checkData(data));
                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }

            },

            /**
             * Add to a user's points (Points.add)
             *
             * @param {(int|String)} user - user_id (int) or MC player name (String) (If you don't give it a parameter, it will use the logged in user.)
             * @param {int} points - Number of points to set for the user
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example
             * // Example data (this is not the output, it's data just for this example)
             * {
             *  username:"Superjo149",
             *  user_id: 4158534,
             *  current_points: 50
             * }
             * @example <caption>Sync request</caption>
             * var new_points = EnjinAPIHelper.points.add("Superjo149",10); // new_points = 60
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.points.add("Superjo149",10,function(data){
             *  var new_points = data; // new_points = 60
             * });
             *
             * @returns {int} points - New point balance
             */
            add: function (user, points, callback) {
                var method = "Points.add";

                if (!points) return throwError(2, "points");
                if (!user) return throwError(2, "parameter 1");

                var param = {
                    points: points
                };

                if (user) {
                    if (typeof user == 'string' || user instanceof String) {
                        param.player = user;
                        param.user_id = false;
                    } else {
                        param.user_id = user;
                    }
                }

                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(checkData(data));
                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }
            },

            /**
             * Remove points from a user (Points.remove)
             *
             * @param {(int|String)} user - user_id (int) or MC player name (String) (If you don't give it a parameter, it will use the logged in user.)
             * @param {int} points - Number of points to set for the user
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example
             * // Example data (this is not the output, it's data just for this example)
             * {
             *  username:"Superjo149",
             *  user_id: 4158534,
             *  current_points: 50
             * }
             * @example <caption>Sync request</caption>
             * var new_points = EnjinAPIHelper.points.remove("Superjo149",10); // new_points = 40
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.points.remove("Superjo149",10,function(data){
             *  var new_points = data; // new_points = 40
             * });
             *
             * @returns {int} points - New point balance
             */
            remove: function (user, points, callback) {
                var method = "Points.remove";

                if (!points) return throwError(2, "points");

                var param = {
                    points: points
                };

                if (user) {
                    if (typeof user == 'string' || user instanceof String) {
                        param.player = user;
                        param.user_id = false;
                    } else {
                        param.user_id = user;
                    }
                }

                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(checkData(data));
                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }

            },

            /**
             * Get recent points (Points.getRecent)
             *
             * @param {int} [seconds=1800] - The time span it needs to get the recent points from in seconds
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example
             * // Let's say we just executed the points.remove method (with the example data), you will recieve following response
             *{
             * 4158534: "40"
             * }
             *
             * @example <caption>Sync request</caption>
             * var recent_points = EnjinAPIHelper.points.getRecent();
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.points.getRecent(null,function(data){
             *  var recent_points = data;
             * });
             *
             * @returns {getRecent_result} points - Number of point's a user has
             */
            getRecent: function (seconds, callback) {
                var method = "Points.getRecent";

                var param = {
                    seconds: (seconds) ? seconds : 1800
                };

                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        user = checkData(data);
                        callback(user);
                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }
            }

            /**
             * @class
             * @name getRecent_result
             *
             * @property {Object[]} points
             * @property {int} points[] Points for user with this user_id
             */
        },

        /**
         * Tags methods
         *
         * @memberof EnjinAPIHelper
         * @type {object}
         * @namespace EnjinAPIHelper.tags
         */
        tags: {

            /**
             * Get all tag types (Tags.getTagTypes )
             *
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             * @param {boolean} [force_update] - Whether you want to resend the request or just use the cached variable
             *
             * @example // Example return data
             *
             * {
             *  "1422081":{
             *   "tag_id":"1422081",
             *   "tagname":"test tag",
             *   "numusers":"1",
             *   "visible":"1"
             *  },
             *  "1431831":{
             *   "tag_id":"1431831",
             *   "tagname":"2nd test tag",
             *   "numusers":"0"
             *   "visible":"1"
             *  }
             * }
             *
             * @example <caption>Sync request</caption>
             * var tag_types = EnjinAPIHelper.tags.getTagTypes();
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.tags.getTagTypes(function(data){
             *  var tag_types = data;
             * });
             *
             * @returns {getTagTypes_result}      tags - Tag object
             */
            getTagTypes: function (callback, force_update) {
                var method = "Tags.getTagTypes";

                if (!tag_types || force_update) {
                    if (callback) {
                        sendAjax(buildRequestWithKey(method), function (data) {
                            tag_types = checkData(data);
                            callback(tag_types);
                        });
                    } else {
                        tag_types = sendAjax(buildRequestWithKey(method));
                    }
                }
                return tag_types;
            },

            /**
             * @class
             * @name getTagTypes_result
             *
             * @property {Object[]} result
             * @property {int} result[].numusers - Number of users with this tag
             * @property {int} result[].tag_id - Tag's id
             * @property {String} result[].tagname - Tag name
             * @property {boolean} result[].visible -
             */


            /**
             * Gets tag from certain User_id (Tags.get)
             *
             * @param {Object} data
             * @param {int} data.user_id - Search by character name
             * @param {boolean} [data.characters] - Include all characters for each is included grouped by game
             * @param {boolean} [data.mcplayers] - Include all additional Minecraft players that made shop purchases into the characters list
             * @param {int} [data.page=1] - Returns the n'th batch of 10000 users
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example // Example return data
             *
             * {
             *  1422081: "test tag"
             * }
             *
             * @example <caption>Sync request</caption>
             * var user_tags = EnjinAPIHelper.tags.getTagsFromUser({user_id:4158534});
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.tags.getTagsFromUser({user_id:4158534},function(data){
             *  var user_tags = data;
             * });
             *
             * @return {getTags_result}
             */

            getTagsFromUser: function (data, callback) {
                if (!data) return throwError(2, "parameter 1");
                if (!data.user_id) return throwError(2, "user_id");

                data.character = false;
                return this.get(data, callback);

            },

            /**
             * @class
             * @name getTags_result
             *
             * @property {Object[]} result
             * @property {user_id} result[].numusers - Number of users with this tag
             */


            /**
             * Gets tag from certain game character (Tags.get)
             *
             * @param {Object}      data
             * @param {String}      data.character - Search by character name
             * @param {boolean}     [data.characters] - Include all characters for each is included grouped by game
             * @param {boolean}     [data.mcplayers] - Include all additional Minecraft players that made shop purchases into the characters list
             * @param {int}         [data.page=1] - Returns the n'th batch of 10000 users
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example // Example return data
             *
             * {
             *  1422081: "test tag"
             * }
             *
             * @example <caption>Sync request</caption>
             * var user_tags = EnjinAPIHelper.tags.getTagsFromCharacter({character:"Superjo149"});
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.tags.getTagsFromCharacter({character:"Superjo149"},function(data){
             *  var user_tags = data;
             * });
             *
             * @returns {getTags_result}
             */

            getTagsFromCharacter: function (data, callback) {
                if (!data) return throwError(2, "parameter 1");
                if (!data.character) return throwError(2, "character");

                return this.get(data, callback);
            },

            /**
             * Get all tags (tags.get)
             *
             * @param {Object}      [data]
             * @param {boolean}     [data.characters] - Include all characters for each is included grouped by game
             * @param {boolean}     [data.mcplayers] - Include all additional Minecraft players that made shop purchases into the characters list
             * @param {int}         [data.page=1] - Returns the n'th batch of 10000 users
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             * @param callback
             *
             * @example // Example return data (Tags object)
             *
             * {
             * "tags":{
             *  "1422081":{
             *   "name":"test tag",
             *   "visible":"1",
             *   "users":[{
             *     "username":"Superjo149",
             *     "forum_post_count":"59",
             *     "forum_votes":"9",
             *     "forum_up_votes":"9",
             *     "forum_down_votes":"0",
             *     "lastseen":"1433860442",
             *     "datejoined":"1361022938",
             *     "expiry_time":"0"
             *    }]
             *   }
             *  }
             * }
             *
             * @example <caption>Sync request</caption>
             * var all_tags = EnjinAPIHelper.tags.getAll();
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.tags.getAll(null,function(data){
             *  var all_tags = data;
             * });
             *
             * @returns {Tags}
             */
            getAll: function (data, callback) {

                if (data) {
                    data.user_id = false;
                    data.character = false;
                }

                if (!all_tags) {
                    if (callback) {
                        this.get(data, function (data) {
                            all_tags = data;
                            callback(tags);
                        });
                    } else {
                        all_tags = new Tags(this.get(data, callback));
                    }
                }
                return all_tags;
            },

            get: function (data, callback) {
                var method = "Tags.get";
                var param = {};

                if (data) {
                    if (data.user_id) {
                        param.user_id = parseInt(data.user_id);
                    } else if (data.character) {
                        param.character = data.character;
                    }

                    if (data.page) {
                        if (parseInt(data.page) <= 0) {
                            return throwError(4, "page");
                        }
                        param.page = data.page;
                    } else {
                        param.page = options.tags.page
                    }

                    if (data.characters) {
                        param.characters = data.characters;
                    }

                    if (data.mcplayers) {
                        param.mcplayers = data.mcplayers;
                    }
                }


                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(checkData(data));

                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }

            },
            /**
             * Add a tag to a user (Tags.tagUser)
             *
             * @param {Object} data
             * @param {int|String|Array} data.user_id - One or more user id's passed as a single id, comma-delimited string or an array of id's
             * @param {int} data.tag_id - Include all characters for each is included grouped by game
             * @param {Array} [data.expiry] - expiry date, specifing the number of years, months, weeks, days and/or hours until this tag expires and is remove from the user account, each selection optional named in format expire_xxx, e.g. expire_years expire_mode {optional} - 0: no expiry, 1: set expiry (using optional fields: expire_*), 2: set expiry day using 'expire_on_date' timestamp expire_minutes {optional} - Number of minutes till tag expiry, default 0 expire_hours {optional} - Number of hours till tag expiry, default 0 expire_days {optional} - Number of days till tag expiry, default 0 expire_weeks {optional} - Number of weeks till tag expiry, default 0 expire_months {optional} - Number of months till tag expiry, default 0 expire_years {optional} - Number of years till tag expiry, default 0 expire_on_date {optional} - Expiration timestamp
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example <caption>Sync request</caption>
             * var success = EnjinAPIHelper.tags.tagUser({user_id:4158534,tag_id:1431831});
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.tags.tagUser({user_id:4158534,tag_id:1431831},function(data){
             *  var success = data;
             * });
             *
             * @returns {boolean} success
             */
            tagUser: function (data, callback) {
                var method = "Tags.tagUser";

                if (!data) return throwError(2, "parameter 1");
                if (!data.user_id) return throwError(2, "user_id");
                if (!data.tag_id) return throwError(2, "tag_id");

                var param = {
                    user_id: data.user_id,
                    tag_id: data.tag_id
                };

                if (data.expiry) {
                    param.expiry = data.expiry;
                }


                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(checkData(data));

                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }
            },
            /**
             * Remove a tag from a user (Tags.untagUser)
             *
             * @param {int|String|Array} user_id - One or more user id's passed as a single id, comma-delimited string or an array of id's
             * @param {int} tag_id - Include all characters for each is included grouped by game
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example <caption>Sync request</caption>
             * var success = EnjinAPIHelper.tags.untagUser(4158534,1431831);
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.tags.untagUser(4158534,1431831,function(data){
             *  var success = data;
             * });
             *
             * @returns {boolean} success
             */
            untagUser: function (user_id, tag_id, callback) {
                var method = "Tags.untagUser";

                if (!user_id) return throwError(2, "user_id");
                if (!tag_id) return throwError(2, "tag_id");

                var param = {
                    user_id: user_id,
                    tag_id: tag_id
                };

                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(checkData(data));

                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }

            }
        },

        /**
         * User methods
         *
         * @memberof EnjinAPIHelper
         * @type {object}
         * @namespace EnjinAPIHelper.user
         */

        user: {
            /**
             * Get user info (UserAdmin.get)
             *
             * @param {Object}      data - Required parameter
             * @param {int|String|Array} [data.user_id] - Use this parameter or get all users
             * @param {int}         [data.tag_id] - Get user with this tag , $user_id argument will be ignored
             * @param {boolean}     [data.characters] - Include all characters for each included grouped by game
             * @param {boolean}     [data.mcplayers] - Include all additional Minecraft players that made shop purchases into the characters list
             * @param {int}         [data.page] - Returns the n'th batch of 10000 users
             *
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example // Example return data
             *{
             * "4158534":{
             *  "username":"Superjo149",
             *  "forum_post_count":"59",
             *  "forum_votes":"9",
             *  "forum_up_votes":"9",
             *  "forum_down_votes":"0",
             *  "lastseen":"1433860442",
             *  "datejoined":"1361022938",
             *  "points_total":"40",
             *  "points_day":"-10",
             *  "points_week":"-10",
             *  "points_month":"-10",
             *  "points_forum":"0",
             *  "points_purchase":"0",
             *  "points_other":"0",
             *  "points_spent":"10",
             *  "points_decayed":"0",
             *  "points_adjusted":"50"
             * }
             *}
             *
             * @example <caption>Sync request</caption>
             * var user_info = EnjinAPIHelper.user.get({user_id:4158534});
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.user.get({tag_id:1422081},function(data){
             *  var user_info = data;
             * });
             *
             * @returns {getUser_result}    UserAdmin  - UserAdmin.get info requested from the enjin API
             */



            get: function (data, callback) {
                var method = "UserAdmin.get";

                if (!data) return throwError(2, "parameter 1");

                var param = {};

                if (data.tag_id) {
                    param.tag_id = data.tag_id;
                } else if (data.user_id) {
                    param.user_id = data.user_id;
                }

                if (data.page) {
                    if (parseInt(data.page) <= 0) {
                        return throwError(4, "page");
                    }
                    param.page = data.page;
                }

                if (data.characters) {
                    param.characters = data.characters;
                }

                if (data.mcplayers) {
                    param.mcplayers = data.mcplayers;
                }


                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(checkData(data));

                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }
            },

            /**
             * Get Current logged in User (User.get)
             *
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             * @param {boolean}         [force_update] - Whether you want to resend the request or just use the cached variable
             *
             * @example // Example return data (User object)
             *{
             * "avatar_large":"http://cravatar.eu/helmavatar/Superjo149/74.png",
             * "avatar_medium":"http://cravatar.eu/helmavatar/Superjo149/74.png",
             * "avatar_small":"http://cravatar.eu/helmavatar/Superjo149/74.png",
             * "link":"<a href='/profile/4158534'  class='element_username admin'>Superjo149</a> ",
             * "logged_in":true,
             * "registered":"owner",
             * "user_id":4158534,
             * "username":"Superjo149"
             * }
             *
             * @example <caption>Sync request</caption>
             * var user_info = EnjinAPIHelper.user.getCurrent();
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.user.getCurrent(function(data){
             *  var user_info = data;
             * });
             *
             * @returns {User}
             */

            getCurrent: function (callback, force_update) {

                if (!user || force_update) {
                    if (callback) {
                        sendAjax(buildRequest("User.get"), function (data) {
                            user = new User(checkData(data));
                            callback(user);
                        });
                    } else {
                        var data = sendAjax(buildRequest("User.get"));
                        user = new User(data);
                    }
                }

                return user;
            }
        },

        /**
         * Stats methods
         *
         * @memberof EnjinAPIHelper
         * @type {object}
         * @namespace EnjinAPIHelper.stats
         */
        stats: {
            /**
             * Get a user statistics (Stats.get)
             *
             * @param {int} [user_id] - User's ID or current user
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example // Example return data (User_Stats object)
             *{
             * "forum_posts":"59",
             * "forum_likes":"9",
             * "profile_views":"4114",
             * "friend_count":140,
             * "points":40,
             * "last_seen":"Just now",
             * "user_id":"4158534",
             * "gender":"Male",
             * "real_name":"-",
             * "warned_times":"0",
             * "punished_times":"0",
             * "warning_points":null,
             * "location":"Belgium",
             * "joined_on":"Feb 16, 13"
             *}
             *
             * @example <caption>Sync request</caption>
             * var user_stats = EnjinAPIHelper.stats.get(4158534);
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.stats.get(4158534,function(data){
             *  var user_stats = data;
             * });
             *
             * @return {User_Stats} result - User Stats Object
             */
            get: function (user_id, callback) {
                var method = "Stats.get";

                var param = {};

                if (user_id) {
                    param.user_id = user_id;
                }

                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(new User_Stats(checkData(data)));
                    });
                } else {
                    return new User_Stats(sendAjax(buildRequestWithKey(method, param)));
                }
            },
            /**
             * Set a user's stat key (Stats.saveUserStats)
             *
             * @param {int} user_id
             * @param key
             * @param value
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             * @todo Uncomment this when the keys are the actual key names and not user:12064228
             *
             * @returns {boolean} success
             */
            set: function (user_id, key, value, callback) {
                var method = "Stats.saveUserStats";
                if (!user_id) return throwError(2, 'user_id');
                if (!key) return throwError(2, 'stat key');
                if (!value) return throwError(2, 'stat value');

                var stats = {};
                stats[user_id] = {};
                stats[user_id][key] = value;

                var param = {
                    stats: stats
                };

                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(checkData(data));
                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }
            },

            /**
             * Set multiple stats for this user (Stats.saveUserStats)
             *
             * @param {int} user_id
             * @param stats
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             * @todo Uncomment this when the keys are the actual key names and not user:12064228
             *
             * @returns {boolean} success
             */
            setMultiple: function (user_id, stats, callback) {
                var method = "Stats.saveUserStats";
                stats = {};
                stats[user_id] = {};

                for (key in stats) {
                    if (stats.hasOwnProperty(key)) {
                        stats[user_id][key] = stats[key];
                    }
                }

                var param = {
                    stats: stats

                };

                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback(checkData(data));
                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }
            }
        },

        /**
         * News methods
         *
         * @memberof EnjinAPIHelper
         * @type {object}
         * @namespace EnjinAPIHelper.news
         */
        news: {

            /**
             * Get the latest news (News.getNews)
             *
             * @param {int} [page=1] - Which page to get the news from
             * @param {int} [items] - Number of articles to return
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example // Example return data (User_Stats object)
             *{
             *}
             *
             * @example <caption>Sync request</caption>
             * var latest_news = EnjinAPIHelper.news.get();
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.news.get(function(data){
             *  var latest_news = data;
             * });
             *
             * @return {User_Stats} result - User Stats Object
             */
            get: function (page, items, callback) {

                var method = "News.getNews";
                if (!options || !options.news.preset_id) return throwError(6, method);

                var param = {
                    preset_id: options.news.preset_id
                };

                if (items) {
                    param.items = items;
                }

                if (page) {
                    if (parseInt(page) <= 0) {
                        return throwError(4, "page");
                    }
                    param.page = page;
                } else {
                    param.page = options.tags.page
                }


                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback((checkData(data)));
                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }
            },

            /**
             * Get the latest news (News.getNews)
             *
             * @param {int} [page=1] - Which page to get the news from
             * @param {int} [items] - Number of articles to return
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @example // Example return data (User_Stats object)
             *{
             *}
             *
             * @example <caption>Sync request</caption>
             * var latest_news = EnjinAPIHelper.news.get();
             *
             * @example <caption>Async request</caption>
             * EnjinAPIHelper.news.get(function(data){
             *  var latest_news = data;
             * });
             *
             * @return {User_Stats} result - User Stats Object
             */
            getArticle: function (article_id, callback) {

                var method = "News.getArticle";
                if (!options || !options.news.preset_id) return throwError(6, method);
                if (!article_id) return throwError(2, "article_id");

                var param = {
                    preset_id: options.news.preset_id,
                    article_id: article_id
                };

                if (callback) {
                    sendAjax(buildRequestWithKey(method, param), function (data) {
                        callback((checkData(data)));
                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, param));
                }
            }
        },

        /**
         * Custom methods
         *
         * @memberof EnjinAPIHelper
         * @type {object}
         * @namespace EnjinAPIHelper.custom
         */
        custom: {
            withApiKey: function (method, params, callback) {
                if (callback) {
                    sendAjax(buildRequestWithKey(method, params), function (data) {
                        callback(checkData(data));
                    });
                } else {
                    return sendAjax(buildRequestWithKey(method, params));
                }
            },

            custom: function (method, params, callback) {
                if (callback) {
                    sendAjax(buildRequest(method, params), function (data) {
                        callback(checkData(data));
                    });
                } else {
                    return sendAjax(buildRequest(method, params));
                }
            }
        }


    };


    /**
     * User Object
     *
     * @param {Object} data - Incoming enjin data
     * @constructor
     *
     * @property {String}   avatar_large - Large avatar source
     * @property {String}   avatar_medium - Medium avatar source
     * @property {String}   avatar_small - Small avatar source
     * @property {String}   link - Html a tag with username and link in
     * @property {boolean}  logged_in - Wether user is logged in or not
     * @property {String}   registered - Wether user is logged in or not
     * @property {int}      user_id - User's id
     * @property {String}   username - Username
     */

    this.User = function (data) {
        this.avatar_large = data.avatar_large;
        this.avatar_medium = data.avatar_medium;
        this.avatar_small = data.avatar_small;
        this.link = data.link;
        this.logged_in = data.logged_in;
        this.registered = data.registered;
        this.user_id = parseInt(data.user_id);
        this.username = data.username;

        var user = this;

        this.points = {
            amount: null,
            /**
             * Get a user's points (Points.get)
             *
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             * @param {boolean}         [force_update] - Whether you want to resend the request or just use the cached variable
             *
             * @returns {int} points - Number of point's a user has
             */
            get: function (callback, force_update) {

                var this_amount = this;

                if (!this_amount.amount || force_update) {
                    if (callback) {
                        EnjinAPIHelper.points.get(user.user_id, function (data) {
                            this_amount.amount = data;
                            callback(this_amount.amount);
                        });
                    } else {
                        this_amount.amount = EnjinAPIHelper.points.get();
                    }
                }

                return this_amount.amount;
            },

            /**
             * Set a user's points (Points.set)
             *
             * @param {int} points - Number of points to set for the user
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @returns {int} points - Number of point's a user has
             */
            set: function (points, callback) {

                var this_amount = this;

                if (callback) {
                    EnjinAPIHelper.points.set(user.user_id, points, function (data) {
                        this_amount.amount = data;
                        callback(this_amount.amount);
                    });
                } else {
                    this_amount.amount = EnjinAPIHelper.points.set(user.user_id, points);
                }

                return this_amount.amount;
            },

            /**
             * Add to a user's points (Points.add)
             *
             * @param {int} points - Number of points to set for the user
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @returns {int} points - New point balance
             */
            add: function (points, callback) {

                var this_amount = this;

                if (callback) {
                    EnjinAPIHelper.points.add(user.user_id, points, function (data) {
                        this_amount.amount = data;
                        callback(this_amount.amount);
                    });
                } else {
                    this_amount.amount = EnjinAPIHelper.points.add(user.user_id, points);
                }

                return this_amount.amount;
            },

            /**
             * Remove points from a user (Points.remove)
             *
             * @param {int} points - Number of points to set for the user
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @returns {int} points - New point balance
             *
             */
            remove: function (points, callback) {

                var this_amount = this;

                if (callback) {
                    EnjinAPIHelper.points.remove(user.user_id, points, function (data) {
                        this_amount.amount = data;
                        callback(this_amount.amount);
                    });
                } else {
                    this_amount.amount = EnjinAPIHelper.points.remove(user.user_id, points);
                }

                return this_amount.amount;
            }
        };

        this.tags = {
            user_tags: null,

            /**
             * Get tags from user (Tags.get)
             *
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             * @param {boolean}         [force_update] - Whether you want to resend the request or just use the cached variable
             *
             * @returns {Array}
             */
            get: function (callback, force_update) {

                var this_tags = this;

                if (!this_tags.user_tags || force_update) {
                    if (callback) {
                        EnjinAPIHelper.tags.get({user_id: user.user_id}, function (data) {
                            this_tags.user_tags = data;
                            callback(this_tags);
                        });
                    } else {
                        this_tags.user_tags = EnjinAPIHelper.tags.get({user_id: user.user_id})
                    }
                }

                return this_tags.user_tags;
            },

            /**
             * Tag a user (Tags.tagUser)
             *
             * @param {int} tag_id
             * @param expiry
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @returns {boolean} success
             */
            tag: function (tag_id, expiry, callback) {
                if (!tag_id) throwError(2, "tag_id");

                var _this = this;

                var param = {
                    user_id: user.user_id,
                    tag_id: tag_id
                };

                if (expiry) {
                    param.expiry = expiry;
                }

                if (callback) {
                    EnjinAPIHelper.tags.tagUser(param, function (data) {
                        callback(data);
                    });
                } else {
                    return EnjinAPIHelper.tags.tagUser(param);
                }
            },
            /**
             * Untag a user (Tags.untagUser)
             *
             * @param {int} tag_id
             * @param {requestCallback} [callback] - The callback that handles the response for async requests
             *
             * @returns {boolean} success
             */
            unTag: function (tag_id, callback) {

                if (!tag_id) throwError(2, "tag_id");

                if (callback) {
                    EnjinAPIHelper.tags.untagUser(user.user_id, tag_id, function (data) {
                        callback(data);
                    });
                } else {
                    var _return = EnjinAPIHelper.tags.untagUser(user.user_id, tag_id);
                    if (_return) {
                        user.tags.get(null, true);
                    }
                    return _return;
                }
            }
        };

        /**
         * Check if current logged in user is staff
         *
         * @param {requestCallback} [callback] - The callback that handles the response for async requests
         * @param {boolean}         [force_update] - Whether you want to resend the request or just use the cached variable
         *
         * @returns {boolean}
         */
        this.isStaff = function (callback, force_update) {
            if (!options || !options.staff) return throwError(1);
            if (this.logged_in == false) return false;

            var _this = this;

            if (!_this.staff || force_update) {
                if (callback) {
                    this.tags.get(function (data) {
                        _this.staff = checkTags(data, options.staff);
                        callback(_this.staff);
                    }, force_update);

                } else {
                    _this.staff = checkTags(this.tags.get(null, force_update), options.staff);
                }
            }

            return _this.staff;
        };
    };

    /**
     * User Stats object
     *
     * @param {object} data - Incoming data from the Stats.get method
     * @constructor
     */
    this.User_Stats = function (data) {
        for (key in data) {
            if (data.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        }

        var this_stats = this;

        /**
         * Set a user's stat key (Stats.saveUserStats)
         *
         * @param key
         * @param value
         * @param {requestCallback} [callback] - The callback that handles the response for async requests
         *
         * @returns {boolean} success
         * @todo Uncomment this when the keys are the actual key names and not user:12064228
         */
        this.set = function (key, value, callback) {
            if (callback) {
                EnjinAPIHelper.stats.set(this_stats.user_id, key, value, function (data) {
                    callback(data);
                });
            } else {
                return EnjinAPIHelper.stats.set(this_stats.user_id, key, value);
            }
        };

        /**
         * Set multiple stats for this user (Stats.saveUserStats)
         *
         * @param stats
         * @param {requestCallback} [callback] - The callback that handles the response for async requests
         * @returns {boolean} success
         * @todo Uncomment this when the keys are the actual key names and not user:12064228
         */
        this.setMultiple = function (stats, callback) {
            if (callback) {
                EnjinAPIHelper.stats.setMultiple(this_stats.user_id, stats, function (data) {
                    callback(data);
                });
            } else {
                return EnjinAPIHelper.stats.set(this_stats.user_id, stats);
            }
        }
    };

    /**
     * Tags object
     *
     * @param {Object}      data - Incoming enjin data
     * @constructor
     *
     * @property {Object[]}    tags - Array of website tags
     * @property {String}      tags.name - Tag name
     * @property {Object[]}    tags.users - Users
     * @property {int}         tags.users.datejoined - Date the user joined in long format
     * @property {int}         tags.users.expiry_time - Tag expiry time
     * @property {int}         tags.users.forum_down_votes - Forum down votes
     * @property {int}         tags.users.forum_post_count - Forum post count
     * @property {int}         tags.users.forum_up_votes - Forum up votes
     * @property {int}         tags.users.forum_votes - Total forum votes
     * @property {int}         tags.users.lastseen - Last seen date in long format
     * @property {String}      tags.users.username - User's username
     * @property {boolean}     tags.visible - Tag visibility
     *
     */
    this.Tags = function (data) {
        var result;
        for (tag_id in data.tags) {
            if (data.tags.hasOwnProperty(tag_id)) {
                var tag = data.tags[tag_id];
                if (tag.users.length > 0) {
                    result = {};
                    for (var i = 0; i < tag.users.length; i++) {
                        var user_id = tag.users[i];
                        tag.users[i] = data.users[user_id];
                    }
                }
            }
        }
        this.tags = data.tags;
    };

    this.Api_News = function (data) {

    };

    this.article = function (data) {

    };


    /**
     * @param {String} api_method
     * @param {Object} [data]
     * @returns {Object}
     */
    function buildRequest(api_method, data) {
        return {
            "jsonrpc": "2.0",
            "id": api_id,
            "method": api_method,
            "params": (data) ? data : {}
        };
    }

    /**
     * @param {String} api_method
     * @param {Object} [data]
     * @returns {Object}
     */
    function buildRequestWithKey(api_method, data) {
        if (!options || !options.api_key) return throwError(3, api_method);

        if (!data) {
            data = {};
        }
        data.api_key = options.api_key;

        return buildRequest(api_method, data);
    }

    /**
     * @param {Object} data
     * @param {requestCallback} [callback]
     * @returns {*}
     */
    function sendAjax(data, callback) {
        if (data !== undefined) {
            if (callback) {
                return $.ajax({
                    type: "POST",
                    url: url(),
                    async: callback ? true : false, // true = parallel, doesn't really affect page loading, false = has to load while page loads
                    data: JSON.stringify(data),
                    complete: callback
                });
            } else {
                return checkData($.ajax({
                    type: "POST",
                    url: url(),
                    async: callback ? true : false, // true = parallel, doesn't really affect page loading, false = has to load while page loads
                    data: JSON.stringify(data)
                }));
            }
        }
    }

    /**
     * @param {int|String} code
     * @param {String} [str] - Optional
     */
    function throwError(code, str) {
        if (!isNaN(code) && errors[code]) {
            var error = errors[code];
            if (str) {
                error = error.replace('{r}', str);
            }
            console.error("EnjinAPIHelper error #" + code + " - " + error);
            if (Enjin_Core && Enjin_Core.Notifications && options.debug) {
                customNotify({
                    growl_class: "EnjinAPIHelper_growl error",
                    growl_text: error
                });
            }
        } else {
            if(options.debug){
                console.error("Enjin throwing errors: " + code);
                if (Enjin_Core && Enjin_Core.Notifications && options.debug) {
                    customNotify({
                        growl_class: "EnjinAPIHelper_growl error",
                        growl_text: "Enjin throwing errors: " + code
                    });
                }
            }
        }

        return undefined;
    }

    /**
     * @param response
     * @returns {*}
     */
    function checkData(response) {
        if (!response.responseJSON) {
            if (response.responseText) {
                var error_response = JSON.parse(response.responseText);
                throwError(error_response.error.message);
                return error_response.error.message;
            }
        } else {
            if (response.responseJSON.id != api_id) {
                throwError(5);
            } else {
                if (!response.responseJSON.result) {
                    if (response.responseJSON.error) {
                        throwError(response.responseJSON.error.message);
                        return response.responseJSON.error.message;
                    }
                } else {
                    return response.responseJSON.result;
                }
            }
        }

    }

    function extendDefaults(source, properties) {
        var property;
        for (property in properties) {
            if (properties.hasOwnProperty(property)) {
                source[property] = properties[property];
            }
        }
        return source;
    }

    /*function tagsToObject(data) {
     if (!data) return {};
     var tags = {};
     for (tag in data) {
     if (data.hasOwnProperty(tag)) {
     tags[tag] = new Tag(tag, data[tag]);
     }
     }
     return tags;
     }*/

    function checkTags(arr1, arr2) {
        for (tag in arr1) {
            if (arr1.hasOwnProperty(tag)) {
                var tag1 = arr1[tag];

                for (tag2 in arr2) {
                    var checktag = arr2[tag2];

                    if (!isNaN(checktag)) { // if it is a number
                        if (tag == checktag) {
                            return true
                        }
                    } else { // String
                        if (tag1 == checktag) {
                            return true
                        }
                    }
                }
            }
        }
        return false;
    }

    this.customNotify = function(data) {
        if ('' == data.growl_class) {
            console.log(data);
            return;
        }

        var block = $('body > .user_tray .growls .template .growl').clone();
        block.attr('href', data.url);
        block.addClass(Enjin_Core.filterOutput(data.growl_class));
        block.find('.growl_avatar').remove();
        block.find('.growl_username').remove();
        block.find('.growl_game').remove();
        block.find('.growl_type').remove();

        data.growl_text ? block.find('.growl_text').html(data.growl_text).show() : null;

        // add the block to the main growls
        var container = $('body > .user_tray .growls .inner').append(block);

        // update the margin top - 54 + 52 * TOTAL_ITEMS
        container.css('margin-top', -(52 * container.children().length - 12) + 'px');

        // make the block disappear after a while
        block.mouseenter(function () {
            $(this).addClass('over');
        }).mouseleave(function () {
            $(this).removeClass('over');
        });

        setTimeout(function () {
            if (false === block.hasClass('over')) {
                block.slideUp(300, function () {
                    $(this).remove();
                });
            } else {
                var onTime = arguments.callee;
                block.mouseleave(function () {
                    setTimeout(onTime, 1600);
                });
            }
        }, 5500);
    };

    /**
     * @callback requestCallback
     * @param {Object} data - Requested object from the enjin API
     * @example
     * function(data){
         *  // use the data
         * }
     */

    /**
     * @class
     * @name getUser_result
     * @property {int}       datejoined - Date the user joined in long format
     * @property {int}       forum_down_votes - User downvotes on forums
     * @property {int}       forum_post_count - Forum post count
     * @property {int}       forum_up_votes - User upvotes on forums
     * @property {int}       forum_votes - Total user votes
     * @property {int}       lastseen - Last seen date in long format
     * @property {int}       points_adjusted - Total points
     * @property {int}       points_day - Earned points today
     * @property {int}       points_decayed - The decay of points that have occured
     * @property {int}       points_forum -
     * @property {int}       points_month -
     * @property {int}       points_other -
     * @property {int}       points_purchase -
     * @property {int}       points_spent - Spent points
     * @property {int}       points_total - Total points
     * @property {int}       points_week - Points earned this week
     * @property {String}    username - User's username
     */

}());
