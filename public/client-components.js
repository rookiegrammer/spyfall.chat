"use strict";function _toConsumableArray(e){if(Array.isArray(e)){for(var t=0,a=Array(e.length);t<e.length;t++)a[t]=e[t];return a}return Array.from(e)}function _defineProperty(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function _possibleConstructorReturn(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function _inherits(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}function toggleFullscreen(e){var t=document.documentElement;e instanceof HTMLElement&&(t=e);var a=document.webkitIsFullScreen||document.mozFullScreen||!1;t.requestFullScreen=t.requestFullScreen||t.webkitRequestFullScreen||t.mozRequestFullScreen||t.msRequestFullscreen||function(){return!1},document.exitFullscreen=document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen||document.msExitFullscreen||function(){return!1},a?document.exitFullscreen():t.requestFullScreen()}var _createClass=function(){function s(e,t){for(var a=0;a<t.length;a++){var s=t[a];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(e,s.key,s)}}return function(e,t,a){return t&&s(e.prototype,t),a&&s(e,a),e}}(),memoji=["😑","😀","😗","😍","🧐","🤓"],MessageBox=function(e){function a(e){_classCallCheck(this,a);var c=_possibleConstructorReturn(this,(a.__proto__||Object.getPrototypeOf(a)).call(this,e));c.setOwner=function(e){c.setState({owner:e})},c.handleMessage=function(e){var t=c.state.messages.concat(e);c.setState({messages:t})},c.handleInputChange=function(e){var t=e.target,a="checkbox"===t.type?t.checked:t.value,s=t.name;c.setState(_defineProperty({},s,a))},c.messageBox=function(){var e=[];if(c.state.messages)for(var t=0;t<c.state.messages.length;t++){var a=c.state.messages[t],s=a.to==c.state.owner,n="msg-outbound",o="To: "+a.to;s&&(n="msg-inbound",o="From: "+a.from);var r=React.createElement("span",{className:"uk-label uk-margin-small-left uk-margin-small-right"},o);e.push(React.createElement("div",{className:n,key:t},s?"":r,React.createElement("div",{className:"msg-wrapper uk-margin-small-top"},a.text),s?r:""))}return e},c.loginDialog=function(){var e=React.createElement("div",{className:"uk-alert-danger uk-padding","uk-alert":!0},React.createElement("a",{className:"uk-alert-close","uk-close":!0}),"You still need to ",React.createElement("a",{className:"uk-link-reset",href:"/signin"},React.createElement("u",null,"login")),"."),t=React.createElement("span",{className:"uk-label"},"Logged in as ",c.state.owner);return null===c.state.owner?e:t},c.connectMessage=function(){c.socket.emit("open message",c.setOwner)},c.sendMessage=function(){var t={event:0,from:c.state.owner,to:c.state.username,text:c.state.message,date:null};c.socket.emit("send message",c.state.username,c.state.message,function(e){t.date=Date.now(),c.handleMessage(t)}),c.setState({message:""})},c.state={username:"",message:"",messages:[],owner:""},c.handleInputChange=c.handleInputChange.bind(c);var t=window.location.port;return c.socket=io.connect("http://"+window.location.hostname+(t?":"+t:"")+"/chat"),c.socket.on("receive message",c.handleMessage),c.connectMessage(),c}return _inherits(a,React.Component),_createClass(a,[{key:"render",value:function(){return React.createElement("div",{className:"msg-box"},this.loginDialog(),React.createElement("div",{className:"uk-margin"},this.messageBox()),React.createElement("div",null,React.createElement("input",{className:"uk-input",type:"text",placeholder:"To",name:"username",onChange:this.handleInputChange,value:this.state.username}),React.createElement("textarea",{className:"uk-textarea uk-margin",onChange:this.handleInputChange,placeholder:"Message",name:"message",value:this.state.message})),React.createElement("button",{onClick:this.sendMessage,className:"uk-button uk-button-primary"},"Send"))}}]),a}(),SpyfallTimer=function(e){function s(e){_classCallCheck(this,s);var t=_possibleConstructorReturn(this,(s.__proto__||Object.getPrototypeOf(s)).call(this,e));t.radius=0,t.componentDidMount=function(){t.radius=t.props.radius,t.setupTick()},t.componentDidUpdate=function(){t.lastStarted==t.props.started&&t.lastLength==t.props.length||t.setupTick()},t.setupTick=function(){t.lastStarted=t.props.started,t.lastLength=t.props.length,t.circumference=2*Math.PI*t.props.radius,t.tick()},t.tick=function(){t.count=Math.floor((Date.parse(t.props.started)-Date.now())/t.props.interval)+t.props.length,0<t.count&&setTimeout(t.tick,t.props.interval),t.update()},t.update=function(){var e=t.props.length-t.count;$("#spyfall-timer-sector-"+t.props.key).css("stroke-dasharray",e*t.circumference/t.props.length+" "+t.circumference),$("#spyfall-timer-text-"+t.props.key).html(0<t.count?t.count:0)},t.props=e,t.count=0;var a=t;return $(window).resize(function(){a.forceUpdate()}),t}return _inherits(s,React.Component),_createClass(s,[{key:"render",value:function(){var e=640<window.innerWidth?this.props.radius:.5*this.props.radius,t=e+e,a=t+t;return React.createElement("div",{className:"spyfall-timer-wrap"},React.createElement("svg",{className:"spyfall-timer-circle",width:a,height:a},React.createElement("circle",{className:"spyfall-timer-sector",id:"spyfall-timer-sector-"+this.props.key,style:{strokeWidth:.8*t},r:e,cx:t,cy:t})),React.createElement("span",{className:"spyfall-timer-text",id:"spyfall-timer-text-"+this.props.key,style:{top:t+"px",left:t+"px"}}))}}]),s}(),SpyfallMessageBox=function(e){function t(e){_classCallCheck(this,t);var c=_possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return c.lastMessagesLength=0,c.lastType="",c.componentDidMount=function(){var e=$("#spyfall-message-"+c.props.key),t=$("#spyfall-message-box-"+c.props.key);e.scrollTop(t.outerHeight()-e.height()),c.lastMessagesLength=c.props.messages.length,c.lastType=c.props.type},c.componentDidUpdate=function(e,t){if(c.lastMessagesLength!=c.props.messages.length||c.lastType!=c.props.type){var a=$("#spyfall-message-"+c.props.key),s=$("#spyfall-message-box-"+c.props.key);a.animate({scrollTop:s.outerHeight()-a.height()},1e3)}},c.qaBox=function(){for(var e=[],t=0;t<c.props.messages.length;t++){var a=c.props.messages[t],s=a.fromUsername==c.props.username?"You":a.fromUsername,n=a.toUsername==c.props.username?"You":a.toUsername;e.push(React.createElement("div",{className:"game-qa-talk uk-margin-medium-bottom",key:"qa-"+t},React.createElement("div",{className:"uk-margin-small-bottom uk-label"},s," asked ",n),React.createElement("div",null,React.createElement("div",{className:"game-talk game-talk-q uk-margin-small-bottom"},a.question)),React.createElement("div",null,React.createElement("div",{className:"game-talk game-talk-a"},a.answer?a.answer:"..."))))}return 0==e.length&&e.push("No Messages :'("),e},c.discussBox=function(){for(var e=[],t=0;t<c.props.messages.length;t++){var a=c.props.messages[t],s=a.fromUsername!=c.props.username,n="msg-outbound",o="",r="";s&&(n="msg-inbound",o="From: "+a.fromUsername,r=React.createElement("span",{className:"uk-label uk-margin-small-left uk-margin-small-right"},o)),e.push(React.createElement("div",{className:n,key:"discuss-"+t},React.createElement("div",{className:"msg-wrapper uk-margin-small-top"},a.message),s&&r))}return 0==e.length&&e.push("No Messages :'("),e},c}return _inherits(t,React.Component),_createClass(t,[{key:"render",value:function(){var e=this.props.title?this.props.title:"Q & A";return React.createElement("div",{id:"spyfall-message-box-"+this.props.key,className:"game-messages uk-card uk-card-body uk-card-secondary uk-card-hover uk-text-center type-"+this.props.type},React.createElement("div",{className:"uk-margin-bottom uk-text-bold"},e),"qa"==this.props.type?this.qaBox():this.discussBox())}}]),t}(),SpyfallProfilesBox=function(e){function t(e){_classCallCheck(this,t);var m=_possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return m.componentDidUpdate=function(e,t){var a=$("#spyfall-user-"+m.props.update);a.hasClass("show")&&a.removeClass("show"),a.toggleClass("show",200,"easeOutSine")},m.createBox=function(){for(var e=[],t=m.props.players,a=Object.keys(t),s=0;s<a.length;s++){var n=a[s],o=t[n],r=n?(n.charAt(0)+"").toUpperCase():"_",c=memoji[o.reaction],l=twemoji.parse(c||memoji[0],{size:72}),i=n==m.props.username,u=o.connected;e.push(React.createElement("div",{className:"player-profile uk-text-center",key:n,"data-username":n},React.createElement("div",{className:"player-avatar"+(i?" player-user":"")+(u?" connected":"")},React.createElement("div",{className:"player-label"},r)),React.createElement("div",{"uk-drop":"pos: right-center"},React.createElement("div",{className:"uk-card uk-card-body uk-card-default"},!i&&React.createElement("div",{className:"player-meta uk-margin-small-bottom"},React.createElement("div",{className:"uk-text-meta"},"Player Username"),React.createElement("div",{className:"uk-text-lead uk-text-bold"},n)),!m.props.open&&React.createElement("div",null,React.createElement("div",{className:"uk-text-meta"},i?"Your":"Player"," Score"),React.createElement("div",{className:"uk-text-lead uk-text-bold"},o.score)),i&&React.createElement("div",{className:"uk-flex uk-flex-center uk-flex-wrap"},m.props.reactButtons))),React.createElement("div",{id:"spyfall-user-"+n,className:"player-reaction",dangerouslySetInnerHTML:{__html:l}})))}return e},m}return _inherits(t,React.Component),_createClass(t,[{key:"render",value:function(){return this.createBox()}}]),t}(),SpyfallGameBox=function(e){function t(e){_classCallCheck(this,t);var h=_possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return h.establish=function(){if(h.socket&&h.socket.socket)h.socket.socket.connect();else{var e=window.location.port;h.socket=io.connect("http://"+window.location.hostname+(e?":"+e:"")+"/game")}},h.createReactionModule=function(){for(var t=[],e=function(){var e=a;t.push(React.createElement("button",{className:"uk-button uk-button-default uk-button-small",onClick:function(){return h.reactGame(e)},key:"emoji-"+a,dangerouslySetInnerHTML:{__html:twemoji.parse(memoji[a])}}))},a=0;a<memoji.length;a++)e();h.reactButtons=t},h.displayError=function(e){console.log(e),e?UIkit.notification({message:e.message?e.message:"Server did not accept inputs.",pos:"top-center"}):UIkit.notification({message:"Server denied your request."})},h.socketHandlers=function(){h.socket.on("round_start game",function(e){h.setState({asked:!1,discussion:[],game:{role:"",location:""},hasAccused:[],initiated:!1,input:!1,messages:[],number:h.state.number+1,phase:0,spyGuessed:!1,timerDelta:0,timerStarted:e,timeoutStarted:e,victory:null,votedBy:"",votes:{},votingFor:""})}),h.socket.on("question_asked game",function(e){var t=h.state.messages.concat(e);h.setState({messages:t})}),h.socket.on("answer_replied game",function(e){if(h.state.messages){var t=h.state.messages.length;h.state.messages[t-1].answer=e.answer,h.setState({messages:h.state.messages})}}),h.socket.on("reacted game",function(e,t){h.state.players[e].reaction=t,h.setState({players:h.state.players,updateEmoji:e})}),h.socket.on("player_joined game",function(e){h.state.players[e]={score:0,reaction:0},h.setState({players:h.state.players})}),h.socket.on("started game",function(){h.setState({open:!1})}),h.socket.on("initiated game",function(e){e&&h.setState({spyGuessed:!0})}),h.socket.on("change_phase game",function(e){h.setState({phase:e})}),h.socket.on("ended game",function(){console.log("DIE")}),h.socket.on("force_reload game",function(){h.connectGame()}),h.socket.on("update_players game",function(e){h.setState({players:e})}),h.socket.on("votes_succeed game",function(){h.setState({votedBy:"",votingFor:"",votes:{}})}),h.socket.on("votes_failed game",function(){h.setState({votedBy:"",votingFor:"",votes:{}})}),h.socket.on("has_voted game",function(e,t){var a=h.state.votes;a[e]=t,h.setState({votes:a})}),h.socket.on("take_votes game",function(e,t,a){console.log(a),h.setState({timeoutStarted:a,votedBy:e,votingFor:t,votes:{}})}),h.socket.on("take_question game",function(e,t){console.log("hey"),console.log(t),h.setState({timeoutStarted:t,input:e,asked:!1})}),h.socket.on("take_answer game",function(e,t){console.log("answer"),console.log(t),h.setState({timeoutStarted:t,input:e,asked:!0})}),h.socket.on("round_end game",function(e,t,a,s){var n=h.state.game;n.endgame={spy:t,location:e,roles:a},h.setState({game:n,victory:s})}),h.socket.on("discussed game",function(e,t){h.state.discussion.push({fromUsername:e,message:t}),h.setState({discussion:h.state.discussion})}),h.socket.on("is_waiting game",function(e){h.setState({timeoutStarted:e})}),h.socket.on("user_connected game",function(e){console.log(e,"connected"),h.state.players[e].connected=!0,h.setState({players:h.state.players})}),h.socket.on("user_disconnected game",function(e){h.state.players[e].connected=!1,h.setState({players:h.state.players})}),h.socket.on("give_role game",function(e){console.log(e),h.setState({game:e})}),h.socket.on("take_location game",function(){console.log("Timer Running")}),h.socket.on("take_suspicion game",function(){h.setState({votedBy:h.state.username})})},h.handleInputChange=function(e){var t=e.target,a="checkbox"===t.type?t.checked:t.value,s=t.name;h.setState(_defineProperty({},s,a))},h.handleLocationPick=function(e){if(2!=h.state.phase||"spy"!=h.state.game.role)return!1;console.log("Check Loc: "+e),h.socket.emit("location game",h.state.roomcode,e,function(e){console.log("Location Correct: "+e)})},h.reactGame=function(a){h.socket.emit("react game",h.state.roomcode,a,function(e){if(1!=e)return h.displayError(e);var t=h.state.players;h.state.players[h.state.username].reaction=a,h.setState({players:t,updateEmoji:h.state.username})})},h.startGame=function(){var e=h.state.roomcode+"";h.socket.emit("start game",e,function(e){if(1!=e)return h.displayError(e);h.setState({open:!1})})},h.newGame=function(){var e=h.state.roomcode+"";h.socket.emit("new game",e,function(e){if(1!=e)return h.displayError(e)})},h.connectGame=function(){var t=h.state.roomcode+"";h.socket.emit("load game",t,function(e){if(0==e)return h.displayError(e);console.log(e),h.setState(e),h.socket.emit("open game",t,function(e){if(1!=e)return h.displayError(e);h.setState({connected:!0})})})},h.closeGame=function(){},h.initiateGame=function(){var e=h.state.roomcode+"";h.socket.emit("initiate game",e,function(e){if(1!=e)return h.displayError(e);h.setState({initiated:!0})})},h.suspectGame=function(){var e=h.state.roomcode+"";h.socket.emit("suspect game",e,h.state.votingFor,function(e){if(1!=e)return h.displayError(e)})},h.voteGame=function(e){var t=h.state.roomcode+"";h.socket.emit("vote game",t,e,function(e){if(1!=e)return h.displayError(e)})},h.discussGame=function(){var e=h.state.roomcode+"",t=h.state.text;h.socket.emit("discuss game",e,t,function(e){if(1!=e)return h.displayError(e);h.state.discussion.push({fromUsername:h.state.username,message:t}),h.setState({discussion:h.state.discussion,text:""})})},h.sendQuery=function(){if(h.state.input===h.state.username){var e=h.state.roomcode+"";if(h.state.asked){var s=h.state.text+"";s&&h.socket.emit("answer game",e,s,function(e){if(1!=e)return h.displayError(e);var t=h.state.messages.length;if(!0===e&&0!=t){var a=h.state.messages.length;h.state.messages[a-1].answer=s,h.setState({messages:h.state.messages,text:""})}})}else{var n=h.state.text+"",o=h.state.target;n&&h.socket.emit("question game",e,o,n,function(e){if(1!=e)return h.displayError(e);var t={fromUsername:h.state.username,toUsername:o,question:n,answer:null},a=h.state.messages.concat(t);h.setState({messages:a,input:null,text:""})})}}},h.targetBox=function(){var e=[],t=null;if(3!=h.state.phase){var a=h.state.messages;0!=a.length&&(t=a[a.length-1].fromUsername)}for(var s=Object.keys(h.state.players),n=0;n<s.length;n++){var o=s[n];o!=h.state.username&&o!=t&&e.push(React.createElement("option",{key:o,value:o},o))}var r=3==h.state.phase;return React.createElement("select",{className:"uk-select",name:r?"votingFor":"target",onChange:h.handleInputChange,value:r?h.state.votingFor:h.state.target},React.createElement("option",null,"-- Select One --"),e)},h.inputBox=function(){var e=h.state.phase,t={normal:0==e,voting:3==e,finding:2==e&&"spy"==h.state.game.role,setvote:3==e&&h.state.votedBy==h.state.username,questioning:0==e&&h.state.input==h.state.username&&!h.state.asked,asked:h.state.asked,discuss:4==e||1==e,discussvoting:4==e&&h.state.votingFor,queried:0==e&&h.state.input==h.state.username,compliance:4==e&&h.state.username!=h.state.votingFor&&h.state.username!=h.state.votedBy};return React.createElement("div",{className:"game-input-box uk-margin-top"},(t.normal||t.setvote)&&React.createElement("div",{className:"uk-padding-small"},React.createElement("b",null,t.setvote||t.queried?"You":t.normal?h.state.input:"Someone")," will ",React.createElement("b",null,t.setvote?"vote":t.asked?"answer":"question"),"."),t.discussvoting&&React.createElement("div",null,React.createElement("b",null,h.state.votedBy)," accuses ",React.createElement("b",null,h.state.votingFor)," as the Spy!"),(t.setvote||t.questioning)&&h.targetBox(),(t.queried||t.discuss)&&React.createElement("input",{className:"uk-input uk-margin-small-top uk-margin-small-bottom",type:"text",name:"text",onChange:h.handleInputChange,value:h.state.text,placeholder:t.queried?t.asked?"Answer":"Question":"Discuss"}),(t.queried||t.setvote||t.discuss)&&React.createElement("button",{onClick:t.queried?h.sendQuery:t.setvote?h.suspectGame:h.discussGame,className:"uk-button uk-button-secondary uk-margin-small-top uk-margin-small-bottom"},t.queried?t.asked?"Reply":"Ask":t.voting?"Vote":"Send"),t.compliance&&React.createElement("span",{className:"uk-margin-small-top uk-margin-small-bottom uk-display-inline-block"},React.createElement("button",{onClick:function(){h.voteGame(!0)},className:"uk-button uk-button-secondary uk-margin-left"},"Agree"),React.createElement("button",{onClick:function(){h.voteGame(!1)},className:"uk-button uk-button-secondary uk-margin-small-left"},"Disagree")))},h.toggleMessageBox=function(){h.setState({toggleMessages:3<=h.state.toggleMessages+1?0:h.state.toggleMessages+1})},h.roleBox=function(){var e=[],t=[],a=0,s=1==h.state.phase,n=h.state.username;if(s){if(!h.state.game.endgame)return"";var o=h.state.game.endgame,r=h.state.number<h.state.rounds;if(e.push("Location is the ",React.createElement("i",{key:"role-"+a++},o.location)),t.push(React.createElement("b",{key:"role-"+a++},o.spy)," is the Spy! "),Object.keys(o.roles).forEach(function(e){n==e?t.push("You are"):t.push(React.createElement("b",{key:"role-"+a++},e)," is"),t.push(" the "+o.roles[e]+". ")}),!r){var c;e.push(". "),(c=e).push.apply(c,_toConsumableArray(t)),t=e;for(var l="",i=!1,u=h.state.players,m=Object.keys(u),p=0;p<m.length;p++){var g=m[p];-1<u[g].score?l=g:-1==u[g].score&&(i=!0,l+=" & "+g)}e=[(i||n!=l?l:"You")+" "+(i||n==l?"are":"is")+" the winner!"]}}else{var d="spy"==h.state.game.role;e=["You are the "+(d?"Spy":h.state.game.role)+"!"],t=[d?"":React.createElement("div",{key:"role-"+a++},"The location is the ",h.state.game.location,".")]}return React.createElement("div",{id:"spyfall-role-box-"+h.props.key,className:"spyfall-role-box uk-padding-small"},React.createElement("h2",{className:"uk-text-bold no-margin"},e),t)},h.playersBox=function(){var e=h.state.updateEmoji;return h.state.updateEmoji="",React.createElement(SpyfallProfilesBox,{players:h.state.players,open:h.state.open,username:h.state.username,reactButtons:h.reactButtons,update:e})},h.messageBox=function(){var e=0==h.state.toggleMessages&&(0==h.state.phase||3==h.state.phase)||1==h.state.toggleMessages&&(1==h.state.phase||4==h.state.phase)||2==h.state.toggleMessages&&2==h.state.phase,t=0==h.state.toggleMessages&&(1==h.state.phase||4==h.state.phase)||1==h.state.toggleMessages&&(0==h.state.phase||2==h.state.phase||3==h.state.phase),a=(2==h.state.toggleMessages||0==h.state.toggleMessages&&h.state.phase,"");if(e&&h.state.messages)a=React.createElement(SpyfallMessageBox,{className:"grow-h game-box",username:h.state.username,messages:h.state.messages,type:"qa",title:"Q & A"});else if(t)a=React.createElement(SpyfallMessageBox,{className:"grow-h game-box",username:h.state.username,messages:h.state.discussion,type:"discuss",title:"Discussion"});else{for(var s=[],n=h.state.locations,o="spy"==h.state.game.role,r=function(){var e=n[c],t=e==h.state.game.location;s.push(React.createElement("span",{key:"location-"+e},React.createElement("button",{onClick:function(){return h.handleLocationPick(e)},disabled:!o&&!t,"data-location":e,className:"uk-button uk-button-small uk-button-primary"},e))),s.push(" ")},c=0;c<n.length;c++)r();a=React.createElement("div",{className:"game-messages grow-h uk-text-center uk-text-break game-locations uk-padding uk-card uk-card-body"},React.createElement("h2",null,"Locations"),s)}return a},h.showMenu=function(){UIkit.offcanvas($("#offcanvas-overlay")).show()},h.toggleRoleBox=function(){var e=$("#spyfall-role-box-"+h.props.key),t=$("#spyfall-role-toggle"+h.props.key);e.hasClass("show")?(t.removeClass("uk-active"),e.removeClass("show").one("transitionend",function(){return e.css("display","none")})):(t.addClass("uk-active"),e.show().addClass("show"))},h.state={console:null,connected:!1,roomcode:"",target:"",text:"",updateEmoji:"",toggleMessages:0,asked:!0,deck:"",discussion:[],game:{role:"",location:""},hasAccused:[],initiated:!1,input:!1,locations:[],master:!1,messages:[],number:0,open:!0,phase:0,players:{},roundLength:540,rounds:8,spyGuessed:!1,timerStarted:"",timerDelta:0,timeoutStarted:null,timeoutLength:30,username:"",victory:null,votedBy:"",votes:{},votingFor:""},document.addEventListener("keydown",function(e){13!=e.keyCode&&13!=e.which||!e.altKey||toggleFullscreen()},!1),$(window).focus(function(){h.socket.disconnected&&h.state.roomcode&&(h.establish(),h.connectGame())}),h.handleInputChange=h.handleInputChange.bind(h),h.handleLocationPick=h.handleLocationPick.bind(h),h.establish(),h.socketHandlers(),h.createReactionModule(),h}return _inherits(t,React.Component),_createClass(t,[{key:"render",value:function(){return React.createElement("div",{className:"game-box grow-h uk-padding uk-padding-remove-horizontal"},this.state.connected?React.createElement("div",{className:"game-box dir-c grow"},React.createElement("div",{className:"game-box"},React.createElement("div",{className:"game-box grow"},this.roleBox()),React.createElement("div",{className:"game-box"},React.createElement("div",null,React.createElement("button",{className:"uk-button uk-button-primary game-initiate",disabled:this.state.initiated||0<=this.state.hasAccused.indexOf(this.state.username),onClick:this.initiateGame},"Initiate ","spy"==this.state.game.role?"Guess":"Suspicion")),React.createElement("div",null,React.createElement("button",{className:"uk-button uk-button-secondary",onClick:this.toggleMessageBox},"Toggle View")),React.createElement("div",{className:"",key:"menu"},React.createElement("a",{className:"menu-button",onClick:this.showMenu},React.createElement("span",{className:"menu-button-label","uk-icon":"icon: menu; ratio: 1.5"}))))),React.createElement("div",{className:"game-box grow uk-margin-left"},React.createElement("div",{className:"player-box"},this.playersBox()),React.createElement("div",{className:"game-box dir-c grow uk-position-relative"},!this.state.open&&React.createElement("div",{className:"game-box grow dir-c uk-position-relative"},React.createElement("div",{className:"spyfall-timer-position-wrap"},React.createElement(SpyfallTimer,{radius:25,interval:1e3,length:this.state.timeoutLength,started:this.state.timeoutStarted})),React.createElement("div",{id:"spyfall-message-"+this.props.key,className:"game-box dir-c grow scroll"},this.messageBox()),this.inputBox()),this.state.master&&(this.state.open||1==this.state.phase)&&React.createElement("button",{onClick:this.state.number<this.state.rounds?0==this.state.number?this.startGame:this.newGame:this.closeGame,className:"uk-button "+(this.state.number<this.state.rounds?"uk-button-primary":"uk-button-danger")},this.state.number<this.state.rounds?0==this.state.number?"Start":"Proceed":"Close"),React.createElement("div",{className:"uk-text-right uk-text-meta uk-margin-small"},React.createElement("a",{className:"",onClick:toggleFullscreen},"Toggle Fullscrren")," | User: ",React.createElement("code",null,this.state.username)," | Room: ",React.createElement("code",null,this.state.roomcode))))):React.createElement("div",{className:"game-box dir-c grow-w"},React.createElement("div",{className:"",key:"menu"},React.createElement("a",{className:"menu-button",onClick:this.showMenu},React.createElement("span",{className:"menu-button-label","uk-icon":"icon: menu; ratio: 1.5"}))),React.createElement("input",{className:"uk-input uk-margin",type:"text",onChange:this.handleInputChange,placeholder:"Room Code",name:"roomcode",value:this.state.roomcode}),React.createElement("button",{onClick:this.connectGame,className:"uk-button uk-button-primary"},"Connect")))}}]),t}();
//# sourceMappingURL=client-components.js.map