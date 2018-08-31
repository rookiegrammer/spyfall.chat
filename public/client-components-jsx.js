'use strict';

const memoji = [
  '😑',
  '😀',
  '😗',
  '😍',
  '🧐',
  '🤓'
]

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
        <div id="msg" className="uk-margin">{this.messageBox()}</div>
        <div>
          <input className="uk-input" type="text" placeholder="To" name="username" onChange={this.handleInputChange} value={this.state.username} />
          <textarea className="uk-textarea uk-margin" id="message" onChange={this.handleInputChange} placeholder="Message" name="message" value={this.state.message}></textarea>
        </div>
        <button onClick={this.sendMessage} className="uk-button uk-button-primary">Send</button>
      </div>
    )
  }
}

class SpyfallGameBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      roomcode: '',
      target: '',
      text: '',
      discuss: false,
      // Served and Provided
      voting: false,
      input: false,
      asked: true,
      game: {
        role: '',
        location: ''
      },
      open: true,
      number: '',
      rounds: '',
      username: '',
      roundLength: '',
      timerStarted: '',
      players: [],
      messages: [],
      guessed: false,
      master: false,
      suspicious: [],
      deck: ''
    }

    this.handleInputChange = this.handleInputChange.bind(this);

    const port = window.location.port

    this.socket = io.connect('http://'+window.location.hostname+(port?':'+port:'')+'/game')

    this.socketHandlers()
    this.createReactionModule()
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
    */
    this.socket.on('round_start game', (date) => {
      this.setState({timerStarted: date})
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
      for (var i = 0; i < this.state.players.length; i++) {
        if (this.state.players[i].username == username) {
          this.state.players[i].reaction = reaction ? reaction : 0
        }
      }

      this.setState({
        players: this.state.players
      })
    })
    this.socket.on('player_joined game', (user) => {
      const players = this.state.players.concat({username: user, score: 0, reaction: 0})
      this.setState({
        players: players
      })
    })
    this.socket.on('started game', () => {
      this.setState({
        open: false
      })
    })
    /*
    PRIVATE
    take_answer game
    take_question game
    give_role game
    take_interrupt game
    */
    this.socket.on('take_question game', () => {
      console.log('hey')
      this.setState({
        input: true,
        asked: false
      })
    })
    this.socket.on('take_answer game', () => {
      console.log('answer')
      this.setState({
        input: true,
        asked: true
      })
    })
    this.socket.on('give_role game', (obj) => {
      console.log(obj)
      this.setState({
        game: obj
      })
    })
    this.socket.on('take_interrupt game', () => {

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

  reactGame = (emoji) => {

    this.socket.emit('react game', this.state.roomcode, emoji, (ack) => {
      if (ack != true) return

      const players = this.state.players

      for (var i = 0; i<players.length; i++) {
        if (players[i].username == this.state.username)
          players[i].reaction = emoji
      }

      this.setState({players: players})
    })
  }

  startGame = () => {
    const roomcode = this.state.roomcode+''
    this.socket.emit('start game', roomcode, (ack) => {
      if (ack != true) return
      this.setState({open: false})
    })
  }

  connectGame = () => {
    const roomcode = this.state.roomcode+''

    this.socket.emit('load game', roomcode, (obj) => {
      console.log(obj)
      this.setState(obj)
      this.socket.emit('open game', roomcode, (ack) => {
        if (ack !== true) return
        this.setState({connected: true})
      })
    })
  }

  sendQuery = () => {
    if (!this.state.input) return

    const roomcode = this.state.roomcode+''

    if (this.state.asked) {
      const answer = this.state.text+''

      if (answer)
        this.socket.emit('answer game', roomcode, answer, (ack) => {
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
          if (ack !== true) return

          const msg_obj = {
            fromUsername: this.state.username,
            toUsername: user,
            question: question,
            answer: null
          }
          var added = this.state.messages.concat(msg_obj)
          this.setState({ messages: added, input: false, text: '' })
        })
    }
  }

  targetBox = () => {
    const targets = []
    for (var i = 0; i < this.state.players.length; i++) {
      const player = this.state.players[i]
      if (player.username != this.state.username) {
        targets.push(
          <option key={player.username} value={player.username}>
            {player.username}
          </option>
        )
      }

    }
    return (
      <select className="uk-select" name="target" onChange={this.handleInputChange} value={this.state.target}>
        <option>-- Select One --</option>
        {targets}
      </select>
    )
  }

  inputBox = () => {
    const input = <div>You will {this.state.asked ? 'answer' : 'question'}.</div>
    return (
      <div>
        { input }
        { this.state.asked ? '' : this.targetBox() }
        <input className="uk-input uk-margin" type="text" name="text" onChange={this.handleInputChange} value={this.state.text} placeholder={this.state.asked ? 'Answer' : 'Question'} />
        <button onClick={this.sendQuery} className="uk-button uk-button-secondary">{this.state.asked ? 'Reply' : 'Ask'}</button>
      </div>
    )
  }

  roleBox = () => {
    const spy = this.state.game.role == 'spy'
    const role = <h1>You are the {spy ? 'Spy' : this.state.game.role}!</h1>
    const location = <div>The location is the {this.state.game.location}.</div>
    return (
      <div className="uk-card uk-card-primary uk-card-body uk-text-center uk-margin-top">
        {role}
        {spy ? '' : location}
      </div>
    )

  }

  playersBox = () => {
    const box = []
    const players = this.state.players

    for (var i = 0; i < players.length; i++) {
      const player = players[i]
      const username = player.username ? player.username : '_'
      const label = (player.username.charAt(0)+'').toUpperCase()
      const moji = memoji[player.reaction]
      const expression = twemoji.parse(moji ? moji : memoji[0],{
        size: 72
      })

      const isUser = players[i].username == this.state.username

      box.push(
        <div className="player-profile uk-text-center uk-display-inline-block" key={player.username} data-username={player.username}>
          <div className={'player-avatar'+(isUser?' player-user':'')}><div className="player-label">{label}</div></div>
          <div uk-drop="pos: bottom-center">
            <div className="uk-card uk-card-body uk-card-default">
              {
                !isUser &&
                <div className="player-meta uk-margin-small-bottom">
                  <div className="uk-text-meta">Player Username</div>
                  <div className="uk-text-lead uk-text-bold">{player.username}</div>
                </div>
              }
              {
                !this.state.open &&
                <div>
                  <div className="uk-text-meta">{isUser?'Your':'Player'} Score</div>
                  <div className="uk-text-lead uk-text-bold">{player.score}</div>
                </div>
              }
              {
                isUser &&
                <div className="uk-flex uk-flex-center uk-flex-wrap">
                  {this.reactButtons}
                </div>
              }
            </div>
          </div>
          <div className="player-reaction" dangerouslySetInnerHTML={{__html: expression}} />
        </div>
      )
    }

    return (<div className="player-box uk-flex uk-flex-center">{box}</div>)

  }

  messageBox = () => {
    const messages = []

    if (this.state.messages)
      for (var i = 0; i < this.state.messages.length; i++) {
        const obj = this.state.messages[i]

        const interviewer = (obj.fromUsername == this.state.username) ? 'You' : obj.fromUsername
        const interviewee = (obj.toUsername == this.state.username) ? 'You' : obj.toUsername

        messages.push(
          <div className="game-qa-talk uk-margin-medium-bottom" key={'qa-'+i}>
            <div className="uk-margin-small-bottom uk-label">{interviewer} asked {interviewee}</div>
            <div><div className="game-talk game-talk-q uk-margin-small-bottom">{obj.question}</div></div>
            <div><div className="game-talk game-talk-a">{obj.answer ? obj.answer : '...'}</div></div>
          </div>)
      }

    return (<div className="uk-card uk-card-body uk-card-secondary uk-card-hover uk-text-center"> {messages.length != 0?messages:'No Messages :\'('} </div>)
  }

  render() {
    return (
      <div className="game uk-padding uk-padding-remove-horizontal">
        <div className="game-box">
          {this.state.connected ?
            <div>
              {this.playersBox()}
              { this.state.master && this.state.open &&
                <button onClick={this.startGame} className="uk-button uk-button-primary">Temp Start Button</button>
              }
              {
                !this.state.open &&
                <div>
                  {this.roleBox()}
                  <div className="uk-margin game-qa">{this.messageBox()} </div>
                  {this.state.input ? this.inputBox() : ''}
                </div>
              }
              <div className="uk-text-right uk-text-meta">User: <code>{this.state.username}</code> | Room: <code>{this.state.roomcode}</code></div>
            </div>
            : <div>
                <input className="uk-input uk-margin" type="text" id="roomcode" onChange={this.handleInputChange} placeholder="Room Code" name="roomcode" value={this.state.roomcode} />
                <button onClick={this.connectGame} className="uk-button uk-button-primary">Connect</button>
              </div>
          }
        </div>
      </div>
    )
  }
}
