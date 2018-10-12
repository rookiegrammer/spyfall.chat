'use strict';

const memoji = [
  '😑',
  '😀',
  '😗',
  '😍',
  '🧐',
  '🤓'
]

function toggleFullscreen(event) {
  var element = document.documentElement;

  if (event instanceof HTMLElement) {
		element = event;
	}

  const isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false

  element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen || function () { return false; }
  document.exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen || function () { return false; }

  isFullscreen ? document.exitFullscreen() : element.requestFullScreen()
}

class MessageBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {username: '', message: '', messages: [], owner: ''}

    this.handleInputChange = this.handleInputChange.bind(this);

    const port = window.location.port

    this.socket = io.connect('http://'+window.location.hostname+(port?':'+port:'')+'/chat')

    this.socket.on('receive message', this.handleMessage)

    this.connectMessage()
  }

  setOwner = (owner) => {
    this.setState({ owner: owner })
  }

  handleMessage = (object) => {
    var joined = this.state.messages.concat(object)
    this.setState({ messages: joined })
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  messageBox = () => {
    const messages = []

    if (this.state.messages)
      for (var i = 0; i < this.state.messages.length; i++) {
        const obj = this.state.messages[i]

        const inbound = obj.to == this.state.owner

        var msg_class = 'msg-outbound'
        var msg_src = 'To: '+obj.to

        if (inbound) {
          msg_class = 'msg-inbound'
          msg_src = 'From: '+obj.from
        }

        var badge = <span className="uk-label uk-margin-small-left uk-margin-small-right">{msg_src}</span>

        messages.push(<div className={msg_class} key={i}>{inbound?'':badge}<div className="msg-wrapper uk-margin-small-top">{obj.text}</div>{inbound?badge:''}</div>)
      }

    return messages
  }

  loginDialog = () => {
    const needLogin =
      <div className="uk-alert-danger uk-padding" uk-alert>
          <a className="uk-alert-close" uk-close></a>
          You still need to <a className="uk-link-reset" href="/signin"><u>login</u></a>.
      </div>
    const loggedIn =
      <span className="uk-label">Logged in as {this.state.owner}</span>
    return (this.state.owner === null)?needLogin:loggedIn
  }

  connectMessage = () => {
    this.socket.emit('open message', this.setOwner)
  }

  sendMessage = () => {
    const obj = {
      event: 0,
      from: this.state.owner,
      to: this.state.username,
      text: this.state.message,
      date: null
    }

    this.socket.emit('send message', this.state.username, this.state.message, (sent) => {
      obj.date = Date.now()
      this.handleMessage(obj)
    })

    this.setState({message: ''})
  }

  render() {
    return (
      <div className="msg-box">
        {this.loginDialog()}
        <div className="uk-margin">{this.messageBox()}</div>
        <div>
          <input className="uk-input" type="text" placeholder="To" name="username" onChange={this.handleInputChange} value={this.state.username} />
          <textarea className="uk-textarea uk-margin" onChange={this.handleInputChange} placeholder="Message" name="message" value={this.state.message}></textarea>
        </div>
        <button onClick={this.sendMessage} className="uk-button uk-button-primary">Send</button>
      </div>
    )
  }
}

class SpyfallTimer extends React.Component {
  constructor(props) {
    super(props)
    this.props = props
    this.count = 0

    const self = this
    $(window).resize(function(){
      self.forceUpdate()
    })
  }

  radius = 0

  componentDidMount = () => {
    this.radius = this.props.radius
    this.setupTick()
  }

  componentDidUpdate = () => {
    if (this.lastStarted != this.props.started || this.lastLength != this.props.length)
      this.setupTick()
  }

  setupTick = () => {
    this.lastStarted = this.props.started
    this.lastLength = this.props.length

    this.circumference = 2 * Math.PI * this.props.radius

    this.tick()
  }

  tick = () => {
    this.count = Math.floor( ( Date.parse(this.props.started) - Date.now() )  / this.props.interval ) + this.props.length

    if (this.count > 0)
      setTimeout(this.tick, this.props.interval)

    this.update()
  }

  update = () => {
    const elapsed = this.props.length - this.count
    $('#spyfall-timer-sector-'+this.props.key).css('stroke-dasharray', (elapsed*this.circumference/this.props.length)+' '+this.circumference );
    $('#spyfall-timer-text-'+this.props.key).html(this.count > 0 ? this.count : 0)
  }

  render() {
    const x1 = window.innerWidth > 640 ? this.props.radius : this.props.radius * 0.5
    const x2 = x1 + x1
    const x4 = x2 + x2
    return (
      <div className="spyfall-timer-wrap">
        <svg className="spyfall-timer-circle" width={x4} height={x4}>
          <circle className="spyfall-timer-sector" id={"spyfall-timer-sector-"+this.props.key} style={{'strokeWidth': x2*.8}} r={x1} cx={x2} cy={x2} />
        </svg>
        <span className="spyfall-timer-text" id={"spyfall-timer-text-"+this.props.key} style={{top: (x2+'px'), left: (x2+'px')}} >
        </span>
      </div>
    )
  }


}

class SpyfallMessageBox extends React.Component {
  constructor(props) {
    super(props);
    // username, messages, type
  }

  lastMessagesLength = 0
  lastType = ''

  componentDidMount = () => {
    var parent = $('#spyfall-message-'+this.props.key);
    var child = $('#spyfall-message-box-'+this.props.key);
    parent.scrollTop( child.outerHeight()-parent.height() );

    this.lastMessagesLength = this.props.messages.length;
    this.lastType = this.props.type;
  }

  componentDidUpdate = (prevProps, prevState) => {
    if ( this.lastMessagesLength == this.props.messages.length
      && this.lastType == this.props.type )
      return

    var parent = $('#spyfall-message-'+this.props.key);
    var child = $('#spyfall-message-box-'+this.props.key);
    parent.animate({ scrollTop: child.outerHeight()-parent.height() }, 1000 );
  }

  qaBox = () => {
    var messages = []

    for (var i = 0; i < this.props.messages.length; i++) {
      const obj = this.props.messages[i]

      const interviewer = (obj.fromUsername == this.props.username) ? 'You' : obj.fromUsername
      const interviewee = (obj.toUsername == this.props.username) ? 'You' : obj.toUsername

      messages.push(
        <div className="game-qa-talk uk-margin-medium-bottom" key={'qa-'+i}>
          <div className="uk-margin-small-bottom uk-label">{interviewer} asked {interviewee}</div>
          <div><div className="game-talk game-talk-q uk-margin-small-bottom">{obj.question}</div></div>
          <div><div className="game-talk game-talk-a">{obj.answer ? obj.answer : '...'}</div></div>
        </div>)
    }

    if (messages.length == 0) {
      messages.push(
        'No Messages :\'('
      )
    }
    return messages
  }

  discussBox = () => {
    var messages = []

    for (var i = 0; i < this.props.messages.length; i++) {
      const obj = this.props.messages[i]

      const inbound = obj.fromUsername != this.props.username

      var msg_class = 'msg-outbound'
      var msg_src = ''
      var badge = ''

      if (inbound) {
        msg_class = 'msg-inbound'
        msg_src = 'From: '+obj.fromUsername
        badge = <span className="uk-label uk-margin-small-left uk-margin-small-right">{msg_src}</span>
      }
      messages.push(
        <div className={msg_class} key={'discuss-'+i}><div className="msg-wrapper uk-margin-small-top">{obj.message}</div>{inbound && badge}</div>
      )
    }

    if (messages.length == 0) {
      messages.push(
        'No Messages :\'('
      )
    }
    return messages
  }

  render() {
    const title = this.props.title ? this.props.title : 'Q & A'
    return (
      <div id={"spyfall-message-box-"+this.props.key} className={"game-messages uk-card uk-card-body uk-card-secondary uk-card-hover uk-text-center type-"+this.props.type}>
        <div className="uk-margin-bottom uk-text-bold">{title}</div>
        {
          this.props.type == 'qa' ? this.qaBox() : this.discussBox()
        }
      </div>
    )
  }
}

class SpyfallProfilesBox extends React.Component {
  constructor(props) {
    super(props);
    // players, username
  }

  componentDidUpdate = (prevProps, prevState) => {

    const el = $('#spyfall-user-'+this.props.update)
    if (el.hasClass('show'))
      el.removeClass('show')
    el.toggleClass('show', 200, "easeOutSine")
  }

  createBox = () => {
    const box = []
    const players = this.props.players
    const playerKeys = Object.keys(players)

    for (var i = 0; i < playerKeys.length; i++) {
      const player = playerKeys[i]
      const obj = players[player]
      const label = player ? (player.charAt(0)+'').toUpperCase() : '_'
      const moji = memoji[obj.reaction]
      const expression = twemoji.parse(moji ? moji : memoji[0],{
        size: 72
      })

      const isUser = player == this.props.username
      const isConnected = obj.connected

      box.push(
        <div className="player-profile uk-text-center" key={player} data-username={player}>
          <div className={'player-avatar'+(isUser?' player-user':'')+(isConnected?' connected':'')}><div className="player-label">{label}</div></div>
          <div uk-drop="pos: right-center">
            <div className="uk-card uk-card-body uk-card-default">
              {
                !isUser &&
                <div className="player-meta uk-margin-small-bottom">
                  <div className="uk-text-meta">Player Username</div>
                  <div className="uk-text-lead uk-text-bold">{player}</div>
                </div>
              }
              {
                !this.props.open &&
                <div>
                  <div className="uk-text-meta">{isUser?'Your':'Player'} Score</div>
                  <div className="uk-text-lead uk-text-bold">{obj.score}</div>
                </div>
              }
              {
                isUser &&
                <div className="uk-flex uk-flex-center uk-flex-wrap">
                  {this.props.reactButtons}
                </div>
              }
            </div>
          </div>
          <div id={"spyfall-user-"+player} className="player-reaction" dangerouslySetInnerHTML={{__html: expression}} />
        </div>
      )
    }

    return box
  }

  render() {
    return (
      this.createBox()
    )
  }
}

class SpyfallGameBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      console: null,
      connected: false,
      roomcode: '',
      target: '',
      text: '',
      updateEmoji: '',
      toggleMessages: 0,
      /*
        Phase 0: Messages View
        Phase 1: Discussion View Phase
        Phase 2: Deck View Phase
      */
      // Served and Provided
      asked: true,
      deck: '',
      discussion: [],
      game: {
        role: '',
        location: ''
      },
      hasAccused: [],
      initiated: false,
      input: false,
      locations: [],
      master: false,
      messages: [],
      number: 0,
      open: true,
      phase: 0,
      players: {},
      roundLength: 540,
      rounds: 8,
      spyGuessed: false,
      timerStarted: '',
      timerDelta: 0,
      timeoutStarted: null,
      timeoutLength: 30,
      username: '',
      victory: null,
      votedBy: '',
      votes: {},
      votingFor: ''
    }

    document.addEventListener("keydown", function(event) {
      if ((event.keyCode == 13 || event.which == 13) && event.altKey) {
        toggleFullscreen()
      }
    }, false)

    $(window).focus( () => {
      if (this.socket.disconnected && this.state.roomcode) {
        this.establish()
        this.connectGame()
      }
    } )

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleLocationPick = this.handleLocationPick.bind(this);

    this.establish()
    this.socketHandlers()

    this.createReactionModule()
  }

  establish = () => {
    if ( this.socket && this.socket.socket)
      this.socket.socket.connect()
    else {
      const port = window.location.port
      this.socket = io.connect('http://'+window.location.hostname+(port?':'+port:'')+'/game')
    }
  }

  createReactionModule = () => {
    const rmojis = []
    for (var i=0; i<memoji.length; i++) {
      const z = i
      rmojis.push(
        <button className="uk-button uk-button-default uk-button-small" onClick={() => this.reactGame(z)} key={'emoji-'+i} dangerouslySetInnerHTML={{__html:twemoji.parse(memoji[i])}} />
      )
    }
    this.reactButtons = rmojis
  }

  displayError = (error) => {
    console.log(error)
    if (error) {
      UIkit.notification({message: error.message ? error.message : 'Server did not accept inputs.', pos: 'top-center'})
      // this.setState({console: error.message ? error.message : 'Server did not accept inputs.'})
    } else {
      UIkit.notification({message: 'Server denied your request.'})
      // this.setState({console: })
    }
  }

  socketHandlers = () => {
    /*
    PUBLIC
    round_start game
    question_asked game
    answer_replied game
    reacted game
    take_vote game
    suspicion_raised game
    spy_guessed game
    player_joined game
    change_phase game
    ended game
    force_reload game
    update_players game
    votes_succeed game
    votes_failed game
    take_votes game
    round_end game
    discussed game
    */
    this.socket.on('round_start game', (date) => {
      this.setState({
        asked: false,
        discussion: [],
        game: {
          role: '',
          location: ''
        },
        hasAccused: [],
        initiated: false,
        input: false,
        messages: [],
        number: this.state.number + 1,
        phase: 0,
        spyGuessed: false,
        timerDelta: 0,
        timerStarted: date,
        timeoutStarted: date,
        victory: null,
        votedBy: '',
        votes: {
        },
        votingFor: ''
      })
    })
    this.socket.on('question_asked game', (msg_new) => {
      var msgs = this.state.messages.concat(msg_new)
      this.setState({ messages: msgs })
    })
    this.socket.on('answer_replied game', (msg_new) => {
      if (!this.state.messages)
        return

      const length = this.state.messages.length
      this.state.messages[length-1].answer = msg_new.answer
      this.setState({ messages: this.state.messages })
    })
    this.socket.on('reacted game', (username, reaction) => {
      this.state.players[username].reaction = reaction
      this.setState({
        players: this.state.players,
        updateEmoji: username
      })
    })
    this.socket.on('player_joined game', (user) => {
      this.state.players[user] = {score: 0, reaction: 0}
      this.setState({
        players: this.state.players
      })
    })
    this.socket.on('started game', () => {
      this.setState({
        open: false
      })
    })
    this.socket.on('initiated game', (isSpy) => {
      if (isSpy)
        this.setState({
          spyGuessed: true
        })
    })
    this.socket.on('change_phase game', (phase) => {
      this.setState({phase: phase})
    })
    this.socket.on('ended game', () => {
      console.log('DIE')
    })
    this.socket.on('force_reload game', () => {
      this.connectGame()
    })
    this.socket.on('update_players game', (players) => {
      this.setState({players: players})
    })
    this.socket.on('votes_succeed game', () => {
      this.setState({
        votedBy: '',
        votingFor: '',
        votes: {}
      })
    })
    this.socket.on('votes_failed game', () => {
      this.setState({
        votedBy: '',
        votingFor: '',
        votes: {}
      })
    })
    this.socket.on('has_voted game', (username, vote) => {
      const votes = this.state.votes
      votes[username] = vote
      this.setState({votes: votes})
    })
    this.socket.on('take_votes game', (username, guess, date) => {
      console.log(date)
      this.setState({
        timeoutStarted: date,
        votedBy: username,
        votingFor: guess,
        votes: {}
      })
    })
    this.socket.on('take_question game', (user, date) => {
      console.log('hey')
      console.log(date)
      this.setState({
        timeoutStarted: date,
        input: user,
        asked: false
      })
    })
    this.socket.on('take_answer game', (user, date) => {
      console.log('answer')
      console.log(date)
      this.setState({
        timeoutStarted: date,
        input: user,
        asked: true
      })
    })
    this.socket.on('round_end game', (location, spy, role, victory) => {
      const game = this.state.game
      game.endgame = {
        spy: spy,
        location: location,
        roles: role
      }
      this.setState({game: game, victory: victory})
    })
    this.socket.on('discussed game', (username, message) => {
      this.state.discussion.push({
        fromUsername: username,
        message: message
      })
      this.setState({discussion: this.state.discussion})
    })
    this.socket.on('is_waiting game', (date) => {
      this.setState({
        timeoutStarted: date
      })
    })
    this.socket.on('user_connected game', (username) => {
      console.log(username, 'connected')
      this.state.players[username].connected = true;
      this.setState( { players: this.state.players } )
    } )
    this.socket.on('user_disconnected game', (username) => {
      this.state.players[username].connected = false;
      this.setState( { players: this.state.players } )
    } )
    /*
    PRIVATE
    give_role game
    take_location game
    take_suspicion game
    */
    this.socket.on('give_role game', (obj) => {
      console.log(obj)
      this.setState({
        game: obj
      })
    })
    this.socket.on('take_location game', () => {
      console.log('Timer Running')
    })
    this.socket.on('take_suspicion game', () => {
      this.setState({
        votedBy: this.state.username
      })
    })
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleLocationPick = (value) => {
    if (this.state.phase != 2 || this.state.game.role != 'spy') return false;
    console.log('Check Loc: '+value)
    this.socket.emit('location game', this.state.roomcode, value, (ack) => {
      console.log('Location Correct: '+ack)
    })
  }

  reactGame = (emoji) => {

    this.socket.emit('react game', this.state.roomcode, emoji, (ack) => {
      if (ack != true) return this.displayError(ack)

      const players = this.state.players
      this.state.players[this.state.username].reaction = emoji

      this.setState({players: players, updateEmoji: this.state.username})
    })
  }

  startGame = () => {
    const roomcode = this.state.roomcode+''
    this.socket.emit('start game', roomcode, (ack) => {
      if (ack != true) return this.displayError(ack)
      this.setState({open: false})
    })
  }

  newGame = () => {
    const roomcode = this.state.roomcode+''
    this.socket.emit('new game', roomcode, (ack) => {
      if (ack != true) return this.displayError(ack)
    })
  }

  connectGame = () => {
    const roomcode = this.state.roomcode+'' // make another string object from this one

    this.socket.emit('load game', roomcode, (obj) => {
      if (obj == false) return this.displayError(obj)
      console.log(obj)
      this.setState(obj)
      this.socket.emit('open game', roomcode, (ack) => {
        if (ack != true) return this.displayError(ack)
        this.setState({connected: true})
      })
    })
  }

  closeGame = () => {

  }

  initiateGame = () => {
    const roomcode = this.state.roomcode+''

    this.socket.emit('initiate game', roomcode, (ack) => {
      if (ack != true) return this.displayError(ack)
      this.setState({
        initiated: true
      })
    })
  }

  suspectGame = () => {
    const roomcode = this.state.roomcode+''

    this.socket.emit('suspect game', roomcode, this.state.votingFor, (ack) => {
      if (ack != true) return this.displayError(ack)
    })
  }

  voteGame = (vote) => {
    const roomcode = this.state.roomcode+''
    this.socket.emit('vote game', roomcode, vote, (ack) => {
      if (ack != true) return this.displayError(ack)
    })
  }

  discussGame = () => {
    const roomcode = this.state.roomcode+''
    const message = this.state.text
    this.socket.emit('discuss game', roomcode, message, (ack) => {
      if (ack != true) return this.displayError(ack)
      this.state.discussion.push({
        fromUsername: this.state.username,
        message: message
      })
      this.setState({discussion: this.state.discussion, text: ''})
    })
  }

  sendQuery = () => {
    if (this.state.input !== this.state.username) return

    const roomcode = this.state.roomcode+''

    if (this.state.asked) {
      const answer = this.state.text+''

      if (answer)
        this.socket.emit('answer game', roomcode, answer, (ack) => {
          if (ack != true) return this.displayError(ack)

          const len = this.state.messages.length

          if (ack !== true || len == 0) return

          const length = this.state.messages.length
          this.state.messages[length-1].answer = answer
          this.setState({ messages: this.state.messages, text: '' })
        })
    } else {
      const question = this.state.text+''
      const user = this.state.target
      if (question)
        this.socket.emit('question game', roomcode, user, question, (ack) => {
          if (ack != true) return this.displayError(ack)

          const msg_obj = {
            fromUsername: this.state.username,
            toUsername: user,
            question: question,
            answer: null
          }
          var added = this.state.messages.concat(msg_obj)
          this.setState({ messages: added, input: null, text: '' })
        })
    }
  }

  targetBox = () => {
    const targets = []

    var lastAsker = null
    if (this.state.phase != 3) {
      const messages = this.state.messages
      if (messages.length != 0)
        lastAsker = messages[messages.length-1].fromUsername
    }

    const playerKeys = Object.keys(this.state.players)

    for (var i = 0; i < playerKeys.length; i++) {
      const player = playerKeys[i]
      if (player != this.state.username && player != lastAsker) {
        targets.push(
          <option key={player} value={player}>
            {player}
          </option>
        )
      }

    }
    const voting = this.state.phase == 3
    return (
      <select className="uk-select" name={ voting ? "votingFor" : "target"} onChange={this.handleInputChange} value={voting ? this.state.votingFor : this.state.target}>
        <option>-- Select One --</option>
        {targets}
      </select>
    )
  }

  inputBox = () => {
    const phase = this.state.phase
    const s = {
      normal: phase == 0,
      voting: phase == 3,
      finding: phase == 2 && this.state.game.role == 'spy',
      setvote: phase == 3 && this.state.votedBy == this.state.username,
      questioning: phase == 0 && this.state.input == this.state.username && !this.state.asked,
      asked: this.state.asked,
      discuss: phase == 4 || phase == 1,
      discussvoting: phase == 4 && this.state.votingFor,
      queried: phase == 0 && this.state.input == this.state.username,
      compliance: phase == 4 && this.state.username != this.state.votingFor && this.state.username != this.state.votedBy
    }
    return (
      <div className="game-input-box uk-margin-top">
        {   (s.normal || s.setvote) &&
            <div className="uk-padding-small"><b>{ (s.setvote || s.queried) ? 'You' : (s.normal ? this.state.input : 'Someone') }</b> will <b>{s.setvote ? 'vote' : (s.asked ? 'answer' : 'question')}</b>.</div>
        }
        {
            (s.discussvoting) &&
            <div><b>{this.state.votedBy}</b> accuses <b>{this.state.votingFor}</b> as the Spy!</div>
        }
        { ((s.setvote) || (s.questioning)) &&
          this.targetBox()
        }
        { ((s.queried) || (s.discuss)) &&
          <input className="uk-input uk-margin-small-top uk-margin-small-bottom" type="text" name="text" onChange={this.handleInputChange} value={this.state.text} placeholder={ s.queried ? (s.asked ? 'Answer' : 'Question') : 'Discuss'} />
        }
        { (s.queried  || s.setvote || s.discuss ) &&
          <button onClick={s.queried ? this.sendQuery : (s.setvote ? this.suspectGame : this.discussGame ) } className="uk-button uk-button-secondary uk-margin-small-top uk-margin-small-bottom">{ s.queried ? (s.asked ? 'Reply' : 'Ask') : (s.voting ? 'Vote' : 'Send') }</button>
        }
        {   s.compliance &&
          <span className="uk-margin-small-top uk-margin-small-bottom uk-display-inline-block">
            <button onClick={() => {this.voteGame(true)}} className="uk-button uk-button-secondary uk-margin-left">Agree</button>
            <button onClick={() => {this.voteGame(false)}} className="uk-button uk-button-secondary uk-margin-small-left">Disagree</button>
          </span>
        }
      </div>
    )
  }

  toggleMessageBox = () => {
    const limit = 3
    this.setState({
      toggleMessages: (this.state.toggleMessages +1 >= limit) ? 0 : (this.state.toggleMessages +1)
    })
  }

  roleBox = () => {
    var heading = [];
    var subtext = [];
    var alignrt = '';
    var elkey = 0;
    const alt = this.state.phase == 1
    const user = this.state.username
    if (alt) {
      if (!this.state.game.endgame) return ''
      const endgame = this.state.game.endgame
      const notend = this.state.number < this.state.rounds

      heading.push('Location is the ', <i key={'role-'+(elkey++)}>{endgame.location}</i>)
      subtext.push(<b key={'role-'+(elkey++)}>{endgame.spy}</b>, ' is the Spy! ')

      Object.keys(endgame.roles).forEach(function(key) {
        const me = user == key
        if (me)
          subtext.push('You are')
        else
          subtext.push(<b key={'role-'+(elkey++)}>{key}</b>, ' is')
        subtext.push(' the ' + endgame.roles[key] + '. ')
      });

      if (!notend) {
        heading.push('. ')
        heading.push(...subtext)
        subtext = heading

        var highest = '';
        var score = -1;
        var tie = false;
        const obj = this.state.players
        const players = Object.keys(obj);
        for (var i = 0; i < players.length; i++) {
          const player = players[i]
          if (obj[player].score > score) {
            highest = player
          } else if (obj[player].score == score) {
            tie = true
            highest += ' & '+player
          }
        }
        heading = [(!tie && user == highest ? 'You' : highest) + ' ' + ( (tie || user == highest)  ? 'are' : 'is') + ' the winner!']
      }

    } else {
      const spy = this.state.game.role == 'spy'
      const alreadyAccused = !spy && this.state.hasAccused.indexOf(this.state.username) >= 0;
      heading = ['You are the '+ (spy ? 'Spy' : this.state.game.role) +'!']
      subtext = [(spy ? '' : <div key={'role-'+(elkey++)}>The location is the {this.state.game.location}.</div>)]
      alignrt = (alreadyAccused || this.state.phase != 0) ? '' : <button className="uk-button uk-button-primary game-initiate" disabled={this.state.initiated} onClick={this.initiateGame}>Initiate {spy?'Guess':'Suspicion'}</button>
    }

    return (
      <div id={"spyfall-role-box-"+this.props.key} className="spyfall-role-box uk-padding-small" style={{display: 'none'}}>
        <div className={"role-box-card uk-text-left uk-card uk-card-default uk-padding uk-card-body"+(alt?' alter':'')}>
          <div className="uk-padding-small uk-background-primary uk-light uk-text-center">
            <h2 className="uk-text-bold no-margin">{heading}</h2>
            { subtext }
            <br />
            <div className="no-margin">{alignrt}</div>
          </div>
        </div>
      </div>
    )


  }

  playersBox = () => {
    const update = this.state.updateEmoji
    this.state.updateEmoji = ''
    return (<SpyfallProfilesBox players={this.state.players} open={this.state.open} username={this.state.username} reactButtons={this.reactButtons} update={update} />)
  }

  messageBox = () => {
    const s = {
      normal: this.state.toggleMessages == 0 && (this.state.phase == 0 || this.state.phase == 3)
           || this.state.toggleMessages == 1 && (this.state.phase == 1 || this.state.phase == 4)
           || this.state.toggleMessages == 2 && this.state.phase == 2,
      discussion: this.state.toggleMessages == 0 && (this.state.phase == 1 || this.state.phase == 4)
               || this.state.toggleMessages == 1 && (this.state.phase == 0 || this.state.phase == 2 || this.state.phase == 3),
      deckview: this.state.toggleMessages == 2 || this.state.toggleMessages == 0 && this.state.phase == 2
    }

    var messages = ''

    if (s.normal && this.state.messages)
      messages = <SpyfallMessageBox className="grow-h game-box" username={this.state.username} messages={this.state.messages} type="qa" title="Q & A" />
    else if (s.discussion) {
      messages = <SpyfallMessageBox className="grow-h game-box" username={this.state.username} messages={this.state.discussion} type="discuss" title="Discussion" />
    } else {
      const list = []
      const locations = this.state.locations
      const isspy = this.state.game.role == 'spy'
      for (var i = 0; i < locations.length; i++) {
        const location = locations[i];
        const correct = location == this.state.game.location

        list.push(
          <span key={"location-"+location}>
            <button onClick={ () => this.handleLocationPick(location) } disabled={!isspy && !correct} data-location={location} className={"uk-button uk-button-small uk-button-primary"}>{location}</button>
          </span>
        )
        list.push(' ')
      }
      messages =
      <div className="grow-h uk-text-center uk-text-break game-locations uk-padding">
        <h2>Locations</h2>
        {list}
      </div>
    }

    return (
      messages
    )
  }

  showMenu = () => {
    UIkit.offcanvas($('#offcanvas-overlay')).show()
  }

  toggleRoleBox = () => {
    const box = $('#spyfall-role-box-'+this.props.key)
    const toggle = $('#spyfall-role-toggle'+this.props.key)
    const shown = box.hasClass('show')
    if (shown) {
      toggle.removeClass('uk-active')
      box.removeClass('show').one('transitionend', () => box.css('display', 'none'))
    } else {
      toggle.addClass('uk-active')
      box.show().addClass('show')
    }
  }

  render() {
    return (
      <div className="game-box grow-h uk-padding uk-padding-remove-horizontal">
        {this.state.connected ?
          <div className="game-box grow">
            <div className="player-box">
              <div className="" key={'menu'}>
                <a className="menu-button" onClick={this.showMenu}><span className="menu-button-label" uk-icon="icon: menu; ratio: 1.5"></span></a>
              </div>
              {this.playersBox()}
            </div>
            <div className="game-box grow dir-c uk-margin-left">
              {
                !this.state.open
                &&
                <div className="uk-margin-small-bottom">
                  <b>SPYFALL.CHAT</b>
                  <div className="uk-align-right no-margin">
                    <a id={"spyfall-role-toggle-"+this.props.key} className="uk-link-heading" onClick={this.toggleRoleBox}>
                      <span className="menu-icon" uk-icon="icon: location; ratio: 1.5"></span>
                    </a>
                    &nbsp; | &nbsp;
                    <a className="uk-link-heading" onClick={toggleFullscreen}>
                      <span className="menu-icon" uk-icon="icon: tv; ratio: 1.5"></span>
                    </a>
                    &nbsp; | &nbsp;
                    <a className="uk-link-heading" onClick={this.toggleMessageBox}>
                      <span className="menu-icon" uk-icon="icon: copy; ratio: 1.5"></span>
                    </a>
                  </div>
                </div>
              }
              <div className="game-box dir-c uk-position-relative">
                {
                  !this.state.open
                  &&
                  this.roleBox()
                }
                {
                  !this.state.open
                  &&
                  <div className="game-box grow dir-c uk-position-relative">
                    <div className="spyfall-timer-position-wrap">
                      <SpyfallTimer radius={25} interval={1000} length={this.state.timeoutLength} started={this.state.timeoutStarted} />
                    </div>
                    <div id={"spyfall-message-"+this.props.key} className="game-box dir-c grow scroll">
                      { this.messageBox()}
                    </div>
                    { this.inputBox() }
                  </div>
                }
                { this.state.master && (this.state.open || this.state.phase == 1) &&
                  <button onClick={this.state.number < this.state.rounds ? (this.state.number == 0 ? this.startGame : this.newGame) : this.closeGame } className={"uk-button "+(this.state.number < this.state.rounds ? "uk-button-primary":"uk-button-danger")}>{this.state.number < this.state.rounds ? (this.state.number == 0 ? 'Start' : 'Proceed') : 'Close'}</button>
                }
                <div className="uk-text-right uk-text-meta uk-margin-small">User: <code>{this.state.username}</code> | Room: <code>{this.state.roomcode}</code></div>
              </div>
            </div>
          </div>
          : <div className="game-box dir-c grow-w">
              <div className="" key={'menu'}>
                <a className="menu-button" onClick={this.showMenu}><span className="menu-button-label" uk-icon="icon: menu; ratio: 1.5"></span></a>
              </div>
              <input className="uk-input uk-margin" type="text" onChange={this.handleInputChange} placeholder="Room Code" name="roomcode" value={this.state.roomcode} />
              <button onClick={this.connectGame} className="uk-button uk-button-primary">Connect</button>
            </div>
        }
      </div>
    )
  }
}
