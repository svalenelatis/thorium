import React, { Component } from "react";
import gql from "graphql-tag";
import { Container, Row, Col, Button, Input } from "reactstrap";
import { graphql, withApollo } from "react-apollo";

import "./style.css";

const DECKS_SUB = gql`
  subscription DecksSub($simulatorId: ID!) {
    decksUpdate(simulatorId: $simulatorId) {
      id
      number
      rooms {
        id
        name
      }
    }
  }
`;

class DecksCore extends Component {
  constructor(props) {
    super(props);
    this.subscription = null;
    this.state = {
      selectedDeck: null,
      selectedRoom: null
    };
  }
  componentWillReceiveProps(nextProps) {
    if (!this.subscription && !nextProps.data.loading) {
      this.subscription = nextProps.data.subscribeToMore({
        document: DECKS_SUB,
        variables: {
          simulatorId: nextProps.simulator.id
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          return Object.assign({}, previousResult, {
            decks: subscriptionData.decksUpdate
          });
        }
      });
    }
  }
  componentWillUnmount() {
    this.subscription && this.subscription();
  }
  _addDeck() {
    const number = window.prompt("What is the deck number?");
    if (!number) return;
    if (this.props.data.decks.find(d => d.number === number)) return;
    const mutation = gql`
      mutation AddDeck($simulatorId: ID!, $number: Int!) {
        addDeck(simulatorId: $simulatorId, number: $number)
      }
    `;
    const variables = {
      simulatorId: this.props.simulator.id,
      number
    };
    this.props.client.mutate({
      mutation,
      variables
    });
  }
  _removeDeck() {
    if (!window.confirm("Are you sure you want to remove this deck?")) return;
    const mutation = gql`
      mutation RemoveDeck($id: ID!) {
        removeDeck(deckId: $id)
      }
    `;
    const variables = {
      id: this.state.selectedDeck
    };
    this.props.client.mutate({
      mutation,
      variables
    });
    this.setState({
      selectedDeck: null,
      selectedRoom: null
    });
  }
  _addRoom() {
    const name = prompt("What is the room name?");
    if (!name) return;
    const mutation = gql`
      mutation AddRoom($simulatorId: ID!, $deckId: ID, $name: String!) {
        addRoom(simulatorId: $simulatorId, deckId: $deckId, name: $name)
      }
    `;
    const variables = {
      simulatorId: this.props.simulator.id,
      deckId: this.state.selectedDeck,
      name
    };
    this.props.client.mutate({
      mutation,
      variables
    });
  }
  _removeRoom() {
    if (!window.confirm("Are you sure you want to remove this room?")) return;
    const mutation = gql`
      mutation RemoveRoom($id: ID!) {
        removeRoom(roomId: $id)
      }
    `;
    const variables = { id: this.state.selectedRoom };
    this.props.client.mutate({
      mutation,
      variables
    });
  }
  _renameRoom() {
    const roomName = this.props.data.decks
      .find(d => d.id === this.state.selectedDeck)
      .rooms.find(r => r.id === this.state.selectedRoom).name;
    const name = prompt("What is the room's new name?", roomName);
    if (!name) return;
    const mutation = gql`
      mutation RenameRoom($id: ID!, $name: String!) {
        renameRoom(roomId: $id, name: $name)
      }
    `;
    const variables = { id: this.state.selectedRoom, name };
    this.props.client.mutate({
      mutation,
      variables
    });
  }
  _exportDecks = () => {
    // Create an element to download with.
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    var json = JSON.stringify(
        this.props.data.decks.map(d => {
          return {
            number: d.number,
            rooms: d.rooms.map(r => ({ name: r.name }))
          };
        })
      ),
      blob = new Blob([json], { type: "octet/stream" }),
      url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = "deckExport.json";
    a.click();
    window.URL.revokeObjectURL(url);
  };
  _importDecks = e => {
    const deckAdd = gql`
      mutation AddDeck($simulatorId: ID!, $number: Int!) {
        addDeck(simulatorId: $simulatorId, number: $number)
      }
    `;
    const roomAdd = gql`
      mutation AddRoom($simulatorId: ID!, $deckNum: Int, $name: String!) {
        addRoom(simulatorId: $simulatorId, deckNumber: $deckNum, name: $name)
      }
    `;
    var reader = new FileReader();
    const self = this;
    reader.onload = function() {
      const result = JSON.parse(this.result);
      result.forEach(d => {
        const variables = {
          simulatorId: self.props.simulator.id,
          number: d.number
        };
        self.props.client.mutate({
          mutation: deckAdd,
          variables
        });
        setTimeout(() => {
          d.rooms.forEach(r => {
            const variables = {
              simulatorId: self.props.simulator.id,
              deckNum: d.number,
              name: r.name
            };
            self.props.client.mutate({
              mutation: roomAdd,
              variables
            });
          });
        }, 1000);
      });
    };
    e.target.files[0] && reader.readAsText(e.target.files[0]);
  };
  render() {
    if (this.props.data.loading || !this.props.data.decks) return null;
    const { decks } = this.props.data;
    const { selectedDeck, selectedRoom } = this.state;
    return (
      <Container className="decks-core">
        <Row>
          <Col sm="6" className="decks-columns">
            <ul className="deckList">
              {decks
                .concat()
                .sort((a, b) => {
                  if (a.number > b.number) return 1;
                  if (b.number > a.number) return -1;
                  return 0;
                })
                .map(d => (
                  <li
                    key={d.id}
                    className={selectedDeck === d.id ? "selected" : ""}
                    onClick={() =>
                      this.setState({ selectedDeck: d.id, selectedRoom: null })}
                  >
                    Deck {d.number}
                  </li>
                ))}
            </ul>
            <div className="buttons">
              <Button
                block
                size="sm"
                color="primary"
                onClick={this._addDeck.bind(this)}
              >
                Add Deck
              </Button>
              <Button
                disabled={!selectedDeck}
                block
                size="sm"
                color="danger"
                onClick={this._removeDeck.bind(this)}
              >
                Remove Deck
              </Button>
              <Button
                block
                size="sm"
                color="primary"
                onClick={this._exportDecks}
              >
                Export
              </Button>
              <label>
                {" "}
                Import:
                <Input type="file" onChange={this._importDecks} />
              </label>
            </div>
          </Col>
          <Col sm="6" className="decks-columns">
            <ul className="roomList">
              {selectedDeck &&
                decks
                  .find(d => d.id === selectedDeck)
                  .rooms.concat()
                  .sort((a, b) => {
                    if (a.name > b.name) return 1;
                    if (b.name > a.name) return -1;
                    return 0;
                  })
                  .map(r => (
                    <li
                      key={r.id}
                      className={selectedRoom === r.id ? "selected" : ""}
                      onClick={() => this.setState({ selectedRoom: r.id })}
                    >
                      {r.name}
                    </li>
                  ))}
            </ul>
            <div className="buttons">
              <Button
                block
                size="sm"
                color="primary"
                onClick={this._addRoom.bind(this)}
              >
                Add Room
              </Button>
              <Button
                disabled={!selectedRoom}
                block
                size="sm"
                color="info"
                onClick={this._renameRoom.bind(this)}
              >
                Rename Room
              </Button>
              <Button
                disabled={!selectedRoom}
                block
                size="sm"
                color="danger"
                onClick={this._removeRoom.bind(this)}
              >
                Remove Room
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

const DECKS_QUERY = gql`
  query Decks($simulatorId: ID!) {
    decks(simulatorId: $simulatorId) {
      id
      number
      rooms {
        id
        name
      }
    }
  }
`;

export default graphql(DECKS_QUERY, {
  options: ownProps => ({
    variables: {
      simulatorId: ownProps.simulator.id,
      names: ["Icons", "Pictures"]
    }
  })
})(withApollo(DecksCore));
