import React, { Component } from "react";
import { Label } from "reactstrap";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import Dot from "./dots";

const SUB = gql`
  subscription Battery($simulatorId: ID) {
    reactorUpdate(simulatorId: $simulatorId) {
      id
      model
      batteryChargeLevel
      displayName
    }
  }
`;

class Battery extends Component {
  sub = null;
  componentWillReceiveProps(nextProps) {
    if (!this.sub && !nextProps.data.loading) {
      this.sub = nextProps.data.subscribeToMore({
        document: SUB,
        variables: { simulatorId: nextProps.simulator.id },
        updateQuery: (previousResult, { subscriptionData }) => {
          return Object.assign({}, previousResult, {
            reactors: subscriptionData.data.reactorUpdate
          });
        }
      });
    }
  }
  componentWillUnmount() {
    // Cancel the subscription
    this.sub && this.sub();
  }
  render() {
    if (this.props.data.loading || !this.props.data.reactors) return null;
    const { reactors } = this.props.data;
    if (!reactors) return null;
    const battery = reactors.find(r => r.model === "battery");
    if (!battery) return null;
    return (
      <div>
        <Label>Battery</Label>
        <Dot color="goldenrod" level={battery.batteryChargeLevel} />
      </div>
    );
  }
}

const QUERY = gql`
  query Battery($simulatorId: ID) {
    reactors(simulatorId: $simulatorId) {
      id
      model
      batteryChargeLevel
      displayName
    }
  }
`;

export default graphql(QUERY, {
  options: ownProps => ({
    fetchPolicy: "cache-and-network",
    variables: { simulatorId: ownProps.simulator.id }
  })
})(Battery);
