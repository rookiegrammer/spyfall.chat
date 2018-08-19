'use strict';

const el = React.createElement;

class MessageBox extends React.Component {
  constructor(props) {
    super(props);
    this.messageOwner = props.messageOwner;
    this.messageType = props.messageType;
    this.messageClient = props.messageClient;
    this.messages = props.messages;
  }

  render() {
    if (this.state.liked) {
      return 'You liked this.';
    }

    return el(
      'button',
      { onClick: () => this.setState({ liked: true }) },
      'Like'
    );
  }
}
