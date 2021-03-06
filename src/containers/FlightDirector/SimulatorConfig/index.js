import React, { Component } from "react";
import {
  Col,
  Row,
  Container,
  Button,
  ButtonGroup,
  Card,
  CardBody
} from "reactstrap";
import gql from "graphql-tag";
import { Query, withApollo } from "react-apollo";

import SimulatorProperties from "./SimulatorProperties";
import * as Config from "./config";

import "./SimulatorConfig.css";

const query = `id
name
layout
exocomps
panels
stepDamage
verifyStep
requiredDamageSteps {
  id
  name
  args {
    end
    cleanup
    name
    orders
    room
    preamble
    type
    message
    code
    inventory
    destination
    equipment
    query
    reactivate
  }
}
optionalDamageSteps {
  id
  name
  args {
    end
    cleanup
    name
    orders
    room
    preamble
    type
    message
    code
    inventory
    destination
    equipment
    query
    reactivate
  }
}
systems {
  id
  type
  name
  requiredDamageSteps {
    id
    name
    args {
      end
      cleanup
      name
      orders
      room
      preamble
      type
      message
      code
      inventory
      destination
      equipment
      query
      reactivate
    }
  }
  optionalDamageSteps {
    id
    name
    args {
      end
      cleanup
      name
      orders
      room
      preamble
      type
      message
      code
      inventory
      destination
      equipment
      query
      reactivate
    }
  }
}
stationSets {
  id
  name
  stations {
    name
    login
    messageGroups
    widgets
    cards {
      name
      component
    }
  }
}`;
const SIMULATOR_SUB = gql`
  subscription SimulatorsUpdate {
    simulatorsUpdate(template: true) {
      ${query}
    }
  }
`;

const STATIONSET_SUB = gql`
  subscription StationSetUpdate {
    stationSetUpdate {
      id
      name
      simulator {
        id
      }
      stations {
        name
        login
        messageGroups
        widgets
        cards {
          name
          component
        }
      }
    }
  }
`;

class SimulatorConfig extends Component {
  state = {};
  selectProperty = prop => {
    this.setState({
      selectedProperty: prop
    });
  };
  removeSimulator = () => {
    const {
      match: {
        params: { simulatorId }
      }
    } = this.props;
    if (simulatorId) {
      if (window.confirm("Are you sure you want to delete that simulator?")) {
        let obj = {
          id: simulatorId
        };
        this.props.client.mutate({
          mutation: gql`
            mutation RemoveSimulator($id: ID!) {
              removeSimulator(simulatorId: $id)
            }
          `,
          variables: obj,
          refetchQueries: [
            {
              query: gql`
                query SideNav {
                  simulators(template: true) {
                    id
                    name
                  }
                }
              `
            }
          ]
        });
        this.props.history.push("/config/simulator");
        this.setState({
          selectedProperty: null
        });
      }
    }
  };
  render() {
    const {
      match: {
        params: { simulatorId }
      }
    } = this.props;
    const { selectedProperty } = this.state;
    return (
      <Container fluid className="simulator-config">
        <h4>Simulator Config </h4>
        <Row>
          <Col sm={2}>
            <SimulatorProperties
              selectProperty={this.selectProperty}
              selectedProperty={selectedProperty}
            />
            <Button
              tag="a"
              href={`${window.location.protocol}//${
                window.location.hostname
              }:${parseInt(window.location.port, 10) +
                1}/exportSimulator/${simulatorId}`}
              block
              size="sm"
              color="info"
            >
              Export
            </Button>
            <ButtonGroup>
              <Button onClick={this.removeSimulator} size="sm" color="danger">
                Remove
              </Button>
            </ButtonGroup>
          </Col>
          <Col sm={10}>
            <Card>
              <CardBody>
                <ConfigComponentData
                  selectedProperty={selectedProperty}
                  simulatorId={simulatorId}
                />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
}

const SIMULATOR_QUERY = gql`
  query Simulators($simulatorId: String!) {
    simulators(id: $simulatorId) {
      ${query}
    }
  }
`;

class ConfigComponent extends React.PureComponent {
  componentDidMount() {
    const { subscribe } = this.props;
    this.simsub = subscribe({
      document: SIMULATOR_SUB,
      updateQuery: (previousResult, { subscriptionData }) => {
        return Object.assign({}, previousResult, {
          simulators: subscriptionData.data.simulatorsUpdate
        });
      }
    });
    this.stationsub = subscribe({
      document: STATIONSET_SUB,
      updateQuery: (previousResult, { subscriptionData }) => {
        const stationSets = subscriptionData.data.stationSetUpdate;
        return Object.assign({}, previousResult, {
          simulators: previousResult.simulators.map(s => {
            const returnSimulator = Object.assign({}, s);
            returnSimulator.stationSets = [];
            stationSets.forEach(ss => {
              if (ss.simulator && returnSimulator.id === ss.simulator.id) {
                returnSimulator.stationSets.push({
                  id: ss.id,
                  name: ss.name,
                  stations: ss.stations,
                  __typename: ss.__typename
                });
              }
            });
            return returnSimulator;
          })
        });
      }
    });
  }
  componentWillUnmount() {
    this.simsub && this.simsub();
  }
  render() {
    const { Comp, selectedSimulator } = this.props;
    return <Comp selectedSimulator={selectedSimulator} />;
  }
}

class ConfigComponentData extends React.PureComponent {
  render() {
    const { selectedProperty, simulatorId } = this.props;
    const Comp = Config[selectedProperty];
    return (
      <Query query={SIMULATOR_QUERY} variables={{ simulatorId }}>
        {({ loading, data, subscribeToMore }) =>
          !loading && Comp ? (
            <ConfigComponent
              Comp={Comp}
              subscribe={subscribeToMore}
              selectedSimulator={data.simulators[0]}
            />
          ) : null
        }
      </Query>
    );
  }
}

export default withApollo(SimulatorConfig);
