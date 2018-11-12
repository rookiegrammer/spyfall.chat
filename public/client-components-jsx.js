'use strict';

const memoji = [
  '😑',
  '😀',
  '😗',
  '😍',
  '🧐',
  '🤓',
  '🕵️‍♂️'
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

    this.Ecircle = React.createRef();
    this.Etext = React.createRef();

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
    if (this.Ecircle && this.Etext) {
      $(this.Ecircle.current).css('stroke-dasharray', (elapsed*this.circumference/this.props.length)+' '+this.circumference );
      $(this.Etext.current).html(this.count > 0 ? this.count : 0)
    }
  }

  render() {
    const x1 = window.innerWidth > 640 ? this.props.radius : this.props.radius * 0.7
    const x2 = x1 + x1
    return (
      <div hidden={this.props.hidden} className="round-timer-wrap">
        <svg className="round-timer-circle" width={x2} height={x2}>
          <circle className="round-timer-sector" ref={this.Ecircle} style={{'strokeWidth': x2}} r={x1} cx={x1} cy={x1} />
          <circle className="round-timer-bg" r={x1*0.65} cx={x1} cy={x1} />
        </svg>
        <span className="round-timer-text" ref={this.Etext} style={{top: (x1+'px'), left: (x1+'px')}} >
        </span>
      </div>
    )
  }


}

class SpyfallProgressTimer extends React.Component {
  constructor(props) {
    super(props)
    this.props = props
    this.count = 0

    this.bar = React.createRef()
  }

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
    if (this.bar)
      this.bar.current.css('width', (elapsed*100/this.props.length)+'%')
  }

  render() {
    return (
      <div className="prog-timer-bg">
        <div ref={this.bar} className="prog-timer-bar">
        </div>
      </div>
    )
  }
}

class SpyfallMessageBox extends React.Component {
  constructor(props) {
    super(props);
    // username, messages, type
    this.messagebox = React.createRef();

    this.Escroll = <div key="scroller" ref={el => this.scroller = el}></div>
  }

  lastMessagesLength = 0
  lastType = ''

  componentDidMount = () => {
    if (this.scroller)
      this.scroller.scrollIntoView()

    this.lastMessagesLength = this.props.messages.length;
    this.lastType = this.props.type;
  }

  componentDidUpdate = (prevProps, prevState) => {
    if ( this.lastMessagesLength == this.props.messages.length
      && this.lastType == this.props.type )
      return
    if (this.scroller)
      this.scroller.scrollIntoView()
  }

  qaBox = () => {
    var messages = []

    for (var i = 0; i < this.props.messages.length; i++) {
      const obj = this.props.messages[i]

      const interviewer = (obj.fromUsername == this.props.username) ? 'You' : obj.fromUsername
      const interviewee = (obj.toUsername == this.props.username) ? 'You' : obj.toUsername

      messages.push(
        <div className="uk-margin-medium-bottom" key={'qa-'+i}>
          <span className="game-qa-talk">
            <div className="game-qa-talk-q">
              <span className="game-talk-person">{interviewer}</span>
              {obj.question}
            </div>
            <div className="game-qa-talk-a">
              <span className="game-talk-person">{interviewee}</span>
              {obj.answer}
            </div>
          </span>
        </div>
      )
    }

    if (messages.length == 0) {
      messages.push(
        'No Messages :\'('
      )
    }
    else messages.push(this.Escroll)
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
    else messages.push(this.Escroll)
    return messages
  }

  render() {
    const title = this.props.title ? this.props.title : 'Q & A'
    return (
      <div className="game-box dir-c grow scroll">
        <div ref={this.messagebox} className={"game-messages uk-card uk-card-body uk-card-secondary uk-card-hover uk-text-center grow type-"+this.props.type}>
          <div className="uk-margin-bottom uk-text-bold">{title}</div>
          {
            this.props.type == 'qa' ? this.qaBox() : this.discussBox()
          }
        </div>
      </div>
    )
  }
}

class SpyfallProfileIcon extends React.Component {
  constructor(props) {
    super(props);
    // data, username, key, isPlayer
    // open, reactButtons
    this.crntReact = props.data.reaction
    this.reactref = React.createRef()
  }
  componentDidUpdate = (prevProps, prevState) => {
    if (this.crntReact != this.props.data.reaction) {
      const el = $(this.reactref.current)
      if (el.hasClass('show'))
        el.removeClass('show')
      el.toggleClass('show', 200, "easeOutSine")
      this.crntReact = this.props.data.reaction
    }
  }
  render() {
    const id = this.props.identifier

    const player = this.props.username
    const obj = this.props.data
    const label = player ? (player.charAt(0)+'').toUpperCase() : '_'
    const moji = memoji[obj.reaction]
    const expression = twemoji.parse(moji ? moji : memoji[0])

    const isUser = this.props.isPlayer || false
    const isConnected = obj.connected

    const position = this.props.position || 'right-center'
    const extra = this.props.extra || false

    return (
      <div className={'player-profile uk-text-center '+this.props.className} key={player} data-username={player}>
        <div className={'player-avatar'+(isUser?' player-user':'')+(isConnected?' connected':'')}><div className="player-label">{label}</div></div>
        <div uk-drop={'pos: '+position}>
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
            {
              extra
            }
          </div>
        </div>
        <div ref={this.reactref} className="player-reaction" dangerouslySetInnerHTML={{__html: expression}} />
      </div>
    )
  }

}

class SpyfallGameBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      console: null,
      checkedin: false,
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
      username: null,
      victory: null,
      votedBy: '',
      votes: {},
      votingFor: ''
    }

    const self = this
    document.addEventListener("keydown", function(event) {
      if ((event.keyCode == 13 || event.which == 13) && event.altKey) {
        toggleFullscreen()
      } else if (event.keyCode == 13 || event.which == 13) {
        self.defaultAction()()
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

  componentDidMount = () => {
    this.socket.emit('whoami game', (ack) => {
      this.setState({username: ack, checkedin: true})
    })
  }

  establish = () => {
    if ( this.socket && this.socket.connected ) return

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
        $('html').css('font-size', '0');

        if (ack != true) return this.displayError(ack)
        this.setState({connected: true})

        $('html').css('font-size', '');
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

      this.state.votes[this.state.username] = vote
      this.setState({votes: this.state.votes})
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
    const didvote = typeof this.state.votes[this.state.username] != 'undefined';
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
      <div className="game-input-box uk-margin-small-top no-shrink">
        {   (s.normal || s.setvote) &&
            <div className="uk-padding-small"><b>{ (s.setvote || s.queried) ? 'You' : (s.normal ? this.state.input : 'Someone') }</b> will <b>{s.setvote ? 'vote' : (s.asked ? 'answer' : 'question')}</b>.</div>
        }
        {
            (s.discussvoting) &&
            <div className="uk-padding-small"><b>{this.state.votedBy}</b> accuses <b>{this.state.votingFor}</b> as the Spy!</div>
        }
        { ((s.setvote) || (s.questioning)) &&
          this.targetBox()
        }
        { ((s.queried) || (s.discuss)) &&
          <input className="uk-input uk-margin-small-top uk-margin-small-bottom" type="text" name="text" onChange={this.handleInputChange} value={this.state.text} placeholder={ s.queried ? (s.asked ? 'Answer' : 'Question') : 'Discuss'} />
        }
        { (s.queried  || s.setvote || s.discuss ) &&
          <button onClick={ this.defaultAction() } className="uk-button uk-button-secondary uk-margin-small-top uk-margin-small-bottom">{ s.queried ? (s.asked ? 'Reply' : 'Ask') : (s.voting ? 'Vote' : 'Send') }</button>
        }
        {   s.compliance &&
          <span className="uk-margin-small-top uk-margin-small-bottom uk-display-inline-block">
            <button onClick={() => {this.voteGame(true)}} disabled={didvote} className="uk-button uk-button-secondary uk-margin-left">Agree</button>
            <button onClick={() => {this.voteGame(false)}} disabled={didvote} className="uk-button uk-button-secondary uk-margin-small-left">Disagree</button>
          </span>
        }
      </div>
    )
  }

  defaultAction = () => {
    const phase = this.state.phase

    if (!this.state.connected)
        return this.connectGame
    else if (phase == 0 && this.state.input == this.state.username)
        return this.sendQuery
    else if (phase == 3 && this.state.votedBy == this.state.username)
        return this.suspectGame
    else
        return this.discussGame
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
      heading = ['You are the '+ (spy ? 'Spy' : this.state.game.role) +'!']
      subtext = [(spy ? '' : <div key={'role-'+(elkey++)}>The location is the {this.state.game.location}.</div>)]
    }

    return (
      <div id={"game-role-box-"+this.props.identifier} className="game-role-box game-stretch uk-padding-small">
        <h2 className="uk-text-bold no-margin">{heading}</h2>
        { subtext }
      </div>
    )


  }

  playersBox = () => {
    const update = this.state.updateEmoji
    this.state.updateEmoji = ''

    const box = []
    const players = this.state.players
    const playerKeys = Object.keys(players)

    const key = this.props.identifier
    const open = this.state.open
    const buttons = this.reactButtons

    for (var i = 0; i < playerKeys.length; i++) {
      const username = playerKeys[i]
      if (username == this.state.username)
        continue;

      box.push(
        <SpyfallProfileIcon data={players[username]} username={username} isplayer={false} key={key+'-'+username} identifier={key} open={open} reactButtons={buttons} />
      )
    }
    return box
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
      messages = <SpyfallMessageBox className="grow-h game-box" identifier={this.props.identifier} username={this.state.username} messages={this.state.messages} type="qa" title="Q & A" />
    else if (s.discussion) {
      messages = <SpyfallMessageBox className="grow-h game-box" identifier={this.props.identifier} username={this.state.username} messages={this.state.discussion} type="discuss" title="Discussion" />
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
      <div className="game-box dir-c grow scroll">
        <div className="game-messages grow-h uk-text-center uk-text-break game-locations uk-padding uk-card uk-card-body scroll grow">
          <h2>Locations</h2>
          {list}
        </div>
      </div>
    }

    return messages
  }

  menuBox = () => {
    return (
      <button onClick={this.showMenu} className="uk-button uk-button-primary uk-margin-small-top uk-width-1-1">Menu</button>
    )
  }

  showMenu = () => {
    UIkit.offcanvas($('#offcanvas-overlay')).show()
  }

  renderGameList = () => {
    const list = $('#spyfall-game-list')
    const content = $('#spyfall-game-list-content')
    const connectGame = (id) => {
      this.state.roomcode = id
      this.connectGame()
      UIkit.modal(list[0]).hide()
    };

    UIkit.modal(list[0]).show()

    this.socket.emit('available game', (games) => {
      const elems = []

      for (var i = 0; i < games.length; i++) {
        const game = games[i]
        elems.push(
          <a className="uk-badge uk-margin-small-right" key={'game-list'+i} onClick={() => connectGame(game.id)}> {game.id} </a>
        )
      }
      var html = <div>
        {elems}
      </div>
      ReactDOM.render(html, content[0])
      list.addClass('loaded')
    })


  }

  render() {
    const username = this.state.username
    return (
      <div className="game-box grow-h uk-padding uk-padding-remove-horizontal">
      {this.state.connected ?
        <div className="game-box dir-c grow">
          <div className="game-box no-shrink">
            <div className="grow uk-position-relative uk-margin-small-right">
              <div className="game-actions-wrap uk-position-relative">
                { this.roleBox() }
              </div>
            </div>
            <div className="game-box no-shrink">
              <div>
                <div className="uk-position-relative game-actions-wrap">
                  <button className="uk-button uk-button-primary game-initiate" disabled={this.state.initiated || this.state.hasAccused.indexOf(username) >= 0} onClick={this.initiateGame}>Initiate { this.state.game.role == 'spy' ?'Guess':'Suspicion'}</button>
                  <button className="uk-button uk-button-secondary game-toggler" onClick={this.toggleMessageBox}>
                    Toggle View
                  </button>
                </div>
              </div>
              <div className="game-box no-shrink game-flex-center" key={'menu'}>
                <SpyfallProfileIcon data={this.state.players[username]} username={username} isplayer={false} identifier={this.props.identifier} key={this.props.identifier+'-'+username} open={this.state.open} isPlayer={true} reactButtons={this.reactButtons} extra={ this.menuBox() } />
              </div>
            </div>
          </div>
          <div className="game-box grow uk-margin-left">
            <div className="player-box uk-margin-small-right">
              <div className="game-stretch">
                <div className="game-box game-stretch grow dir-c">
                  <div className="grow scroll">
                    {this.playersBox()}
                  </div>
                </div>
              </div>
            </div>
            <div className="game-box dir-c grow uk-position-relative">
              {
                !this.state.open
                &&
                <div className="game-box grow dir-c uk-position-relative">
                  <div className="round-timer-position-wrap">
                    <SpyfallTimer hidden={this.state.phase == 1} radius={30} identifier={this.props.identifier} interval={1000} length={this.state.timeoutLength} started={this.state.timeoutStarted} />
                  </div>
                  { this.messageBox() }

                  { this.inputBox() }
                </div>
              }
              { this.state.master && (this.state.open || this.state.phase == 1) &&
                <button onClick={this.state.number < this.state.rounds ? (this.state.number == 0 ? this.startGame : this.newGame) : this.closeGame } className={"uk-button "+(this.state.number < this.state.rounds ? "uk-button-primary":"uk-button-danger")}>{this.state.number < this.state.rounds ? (this.state.number == 0 ? 'Start' : 'Proceed') : 'Close'}</button>
              }
              <div className="uk-text-right uk-text-meta uk-margin-small"><a onClick={this.connectGame}>Reload</a> | <a className="" onClick={toggleFullscreen}>Toggle Fullscreen</a> | User: <code>{username}</code> | Room: <code>{this.state.roomcode}</code></div>
            </div>
          </div>
        </div>
        : <div className="game-box dir-c grow-w game-box-center">
            <div style={{'minWidth': '360px'}}>
              {
                this.state.checkedin ?
                  <div>
                    <div className="uk-navbar-item uk-logo">spyfall.chat</div>
                    {
                      !this.state.username &&
                      <div className="uk-alert-danger uk-padding-small">
                        You may need to <a href="/signin">sign in</a>.
                      </div>
                    }
                    <input className="uk-input uk-margin" type="text" onChange={this.handleInputChange} placeholder="Room Code" name="roomcode" value={this.state.roomcode} />
                    <button onClick={this.connectGame} className="uk-button uk-button-primary uk-width-1-1">Connect</button>
                  </div>
                : <div className="uk-text-center">
                    <div className="uk-margin-small-bottom">Checking You In...</div>
                    <div className="lds-ripple"><div></div><div></div></div>
                  </div>
              }
              {
                this.state.username &&
                <button onClick={this.renderGameList} className="uk-button uk-button-secondary uk-margin-small-top uk-width-1-1">List</button>
              }
              <button onClick={this.showMenu} className="uk-button uk-button-secondary uk-margin-small-top uk-width-1-1">Menu</button>
            </div>
          </div>
      }
      </div>
    )
  }
}
