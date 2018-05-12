import React from "react";
import { Container, Row, Col } from "reactstrap";
import {
  Destination,
  Speed,
  Population,
  Coolant,
  Targeted,
  Battery,
  Damaged,
  AlertCondition,
  Stealth,
  Radiation
} from "./components";
import Tour from "reactour";

import "./style.css";

const trainingSteps = [
  {
    selector: ".enginesBar",
    content:
      "This screen is a heads-up display telling you the status of the systems on the ship. You can use this screen to see many things, like your current destination, damaged systems, or the amount of radiation on the ship."
  },
  {
    selector: ".alert-condition",
    content:
      "Click on one of these alert conditions to change it. You can move your mouse over the condition to see a description of when the condition is applicable."
  }
];

export default props => {
  return (
    <Container fluid className="status-card">
      <Row>
        <Col sm={3}>
          <Destination {...props} />
          <Speed {...props} />
          <Targeted {...props} />
          <Population {...props} />
          <Radiation {...props} />
          {/*<Label>Water</Label>
          <Dots level={0.5} color={"rgb(0,128,255)"} />*/}
          <Battery {...props} />
          <Coolant {...props} />
        </Col>
        <Col sm={6}>
          <Stealth {...props} />
        </Col>
        <Col sm={3}>
          <Damaged {...props} />
          {!props.viewscreen && <AlertCondition {...props} />}
        </Col>
      </Row>
      <Tour
        steps={trainingSteps}
        isOpen={props.clientObj.training}
        onRequestClose={props.stopTraining}
      />
    </Container>
  );
};
