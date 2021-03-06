import React from "react";
import FileExplorer from "../TacticalMap/fileExplorer";
import { Row, Col, FormGroup, Label, Input, FormText } from "reactstrap";
import Tour from "reactour";

const Assets = props => {
  const trainingSteps = () => {
    return [
      {
        selector: ".nothing",
        content: (
          <span>
            Assets are image, 3D models, sounds, videos, and any other files
            which can be used in Thorium. Assets are arranged by use in a
            file-like structure.
          </span>
        )
      },
      {
        selector: ".import",
        content: <span>Asset files can be imported from .aset files.</span>
      },
      {
        selector: ".file-explorer-container",
        content: (
          <span>
            This file explorer can be used to browse, upload, and remove assets.
          </span>
        )
      }
    ];
  };
  const importAssets = evt => {
    if (evt.target.files[0]) {
      const data = new FormData();
      Array.from(evt.target.files).forEach((f, index) =>
        data.append(`files[${index}]`, f)
      );
      fetch(
        `${window.location.protocol}//${window.location.hostname}:${parseInt(
          window.location.port,
          10
        ) + 1}/importAssets`,
        {
          method: "POST",
          body: data
        }
      ).then(() => {
        window.location.reload();
      });
    }
  };
  return (
    <Row>
      <Col sm={8} style={{ height: "80vh" }}>
        <FormGroup className="import">
          <Label for="importFile">Import Assets</Label>
          <Input
            type="file"
            name="file"
            id="importFile"
            onChange={importAssets}
          />
          <FormText color="muted">
            Asset files will be in a ".aset" format.
          </FormText>
        </FormGroup>
        <div className="file-explorer-container">
          <FileExplorer
            config
            directory="/"
            selectedFiles={[]}
            onClick={(e, container) => {}}
            admin
          />
        </div>
      </Col>
      <Tour
        steps={trainingSteps()}
        isOpen={props.training}
        onRequestClose={props.stopTraining}
      />
    </Row>
  );
};

export default Assets;
