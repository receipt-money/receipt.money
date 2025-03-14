import React, { useState, useEffect } from "react";

import { useModal } from "./ModalContext";

import { Grid, Image } from "semantic-ui-react";

import swap_order from "../assets/swap_order.svg";
import limited_order from "../assets/limited_order.svg";
import dca_order from "../assets/dca_order.svg";
import pool from "../assets/pool.svg";
import stake from "../assets/stake.svg";

import "./trade.css";

function TradingMethods() {
  const { selectedOperationType, selectedType, setSelectedType } = useModal();

  const [method, setMethod] = useState("lo");

  useEffect(() => {
    if (selectedType !== "lo") {
      setMethod("lo");
      setSelectedType("lo");
    }
  }, [selectedOperationType, selectedType, setSelectedType]);

  const handleSelectType = (type) => {
    setSelectedType(type);
    sessionStorage.setItem("selectedType", type);
  };

  let layout = (
    <Grid style={{ width: "100%" }}>
      <Grid.Row only="computer tablet" style={{ justifyContent: "center" }}>
        <Grid.Column width={5} style={{ display: "flex", justifyContent: "center" }}>
          <Grid
            className="methodsDiv"
            style={{
              borderBottom: "2px solid #6f8586",
              backgroundColor: "#0e1d24",
              cursor: "pointer",
            }}
            onClick={() => handleSelectType("lo")}
          >
            <Grid.Column width={5} verticalAlign="middle">
              <div
                style={{
                  border: "1px solid grey",
                  padding: "2px",
                  borderRadius: "5px",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#19292f",
                    padding: "6px",
                    margin: "2%",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Image
                    src={limited_order}
                    size="small"
                    style={{ width: "120px", height: "30px" }}
                  />
                </div>
              </div>
            </Grid.Column>
            <Grid.Column width={8} verticalAlign="middle">
              <div className="new-header-text">
                <p>Lock & Mint</p>
            
              </div>
            </Grid.Column>
          </Grid>
        </Grid.Column>
      </Grid.Row>

      <Grid.Row only="mobile" style={{ justifyContent: "center" }}>
        <Grid.Column width={5} style={{ display: "flex", justifyContent: "center" }}>
          <Grid
            className="methodsDiv"
            centered
            style={{
              borderBottom: "2px solid #6f8586",
              backgroundColor: "#0e1d24",
              width: "100%",
              height: "8em",
              cursor: "pointer",
            }}
            onClick={() => handleSelectType("lo")}
          >
            <Grid.Row>
              <div
                style={{
                  border: "1px solid grey",
                  borderRadius: "5px",
                  padding: ".2rem",
                }}
              >
                <Image
                  src={limited_order}
                  size="mini"
                  style={{
                    width: "4em",
                    height: "4em",
                  }}
                />
                <div className="new-header-text">
                  <p>Lock & Mint</p>
                </div>
              </div>
            </Grid.Row>
          </Grid>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      {layout}
    </div>
  );
}

export default TradingMethods;
