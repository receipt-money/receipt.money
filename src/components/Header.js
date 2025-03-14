import React from "react";
import { useModal } from "./ModalContext";

import { Grid, Image, Button, Dropdown, Icon, Menu } from "semantic-ui-react";

import WalletConnectButton from "./WalletConnectButton";

import twitter from "../assets/twitter_icon.svg";
import gitbook from "../assets/gitbook.svg";
import launch_icon from "../assets/launch_icon.svg";

import { useNavigate } from "react-router-dom";

import "./landingfeatures.css";
import "./buttonstyle.css";

function Header({ weblocation }) {
  const navigate = useNavigate();

  const { setSelectedType, selectedOperationType, setSelectedOperationType } =
    useModal();

  const handleMethodChange = (method) => {
    setSelectedOperationType(method);
    if (method === 2) setSelectedType("perps");
  };

  const handleButtonClick = () => {
    navigate("/trade");
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleIconClick = (link) => {
    if (link === "x") {
      window.open("https://x.com/bitcrossfi", "_blank");
    } else if (link === "gitbook") {
      window.open(
        "https://bitcross-organization.gitbook.io/bitcross",
        "_blank"
      );
    }
  };

  let layout;

  if (weblocation === "landingpage") {
    layout = (
      <Grid verticalAlign="middle" columns={3} centered>
        <Grid.Row only="computer">
          <Grid.Column width={4} floated="left">
            <div 
              onClick={handleLogoClick}
              style={{ 
                color: "#ede7df", 
                fontSize: "24px", 
                fontFamily: "'Raleway', sans-serif",
                cursor: "pointer"
              }}
            >
              Receipt.money
            </div>
          </Grid.Column>

          <Grid.Column width={7} floated="right" verticalAlign="middle">
            <Grid>
              <Grid.Column width={5} floated="right" verticalAlign="middle">
                <Grid>
                  <Grid.Column width={8}>
                    <div onClick={() => handleIconClick("x")}>
                      <Image
                        src={twitter}
                        size="mini"
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                  </Grid.Column>

                  <Grid.Column width={8}>
                    <div onClick={() => handleIconClick("gitbook")}>
                      <Image
                        src={gitbook}
                        size="mini"
                        style={{ cursor: "pointer", filter: "invert(95%)" }}
                      />
                    </div>
                  </Grid.Column>
                </Grid>
              </Grid.Column>

              <Grid.Column width={6} verticalAlign="middle">
                <Button onClick={handleButtonClick} className="custom-button">
                  Launch App
                  <Image src={launch_icon} avatar />
                </Button>
              </Grid.Column>
            </Grid>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row only="tablet">
          <Grid.Column width={6} floated="left">
            <div 
              onClick={handleLogoClick}
              style={{ 
                color: "#ede7df", 
                fontSize: "24px", 
                fontFamily: "'Raleway', sans-serif",
                cursor: "pointer"
              }}
            >
              Receipt.money
            </div>
          </Grid.Column>

          <Grid.Column width={7} floated="right" verticalAlign="middle">
            <Grid>
              <Grid.Column width={6} floated="right" verticalAlign="middle">
                <Grid>
                  <Grid.Column width={8}>
                    <div onClick={() => handleIconClick("x")}>
                      <Image
                        src={twitter}
                        size="mini"
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                  </Grid.Column>

                  <Grid.Column width={8}>
                    <div onClick={() => handleIconClick("gitbook")}>
                      <Image
                        src={gitbook}
                        size="mini"
                        style={{ cursor: "pointer", filter: "invert(95%)" }}
                      />
                    </div>
                  </Grid.Column>
                </Grid>
              </Grid.Column>

              <Grid.Column width={8} verticalAlign="middle">
                <Button
                  onClick={handleButtonClick}
                  className="custom-button"
                  style={{ padding: "5%" }}
                >
                  Launch App
                  <Image src={launch_icon} avatar />
                </Button>
              </Grid.Column>
            </Grid>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row only="mobile">
          <Grid.Column width={5} floated="left" style={{ marginTop: "4%" }}>
            <div 
              onClick={handleLogoClick}
              style={{ 
                color: "#ede7df", 
                fontSize: "20px", 
                fontFamily: "'Raleway', sans-serif",
                cursor: "pointer"
              }}
            >
              Receipt.money
            </div>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  } else {
    layout = (
      <Grid verticalAlign="middle" columns={3} centered>
        <Grid.Row only="computer">
          <Grid.Column width={3} floated="left">
            <div 
              onClick={handleLogoClick}
              style={{ 
                color: "#ede7df", 
                fontSize: "24px", 
                fontFamily: "'Raleway', sans-serif",
                cursor: "pointer"
              }}
            >
              Receipt.money
            </div>
          </Grid.Column>

          <Grid.Column width={3} floated="right" verticalAlign="middle">
            <WalletConnectButton />
          </Grid.Column>
        </Grid.Row>

        <Grid.Row only="tablet">
          <Grid.Column width={4} floated="left">
            <div 
              onClick={handleLogoClick}
              style={{ 
                color: "#ede7df", 
                fontSize: "24px", 
                fontFamily: "'Raleway', sans-serif",
                cursor: "pointer"
              }}
            >
              Receipt.money
            </div>
          </Grid.Column>

          <Grid.Column width={4} floated="right" verticalAlign="middle">
            <WalletConnectButton />
          </Grid.Column>
        </Grid.Row>

        <Grid.Row only="mobile" style={{ marginTop: "2%", marginBottom: "2%" }}>
          <Grid.Column width={4} floated="left">
            <div 
              onClick={handleLogoClick}
              style={{ 
                color: "#ede7df", 
                fontSize: "20px", 
                fontFamily: "'Raleway', sans-serif",
                cursor: "pointer"
              }}
            >
              Receipt.money
            </div>
          </Grid.Column>

          <Grid.Column width={4} textAlign="right">
            <Dropdown
              item
              icon="bars"
              direction="left"
              simple
              style={{
                paddingRight: "5%",
                color: "white",
                zIndex: "5",
                position: "relative",
              }}
            >
              <Dropdown.Menu style={{ zIndex: "5" }}>
                <Dropdown.Item
                  style={{
                    backgroundColor: selectedOperationType === 1 ? "#6f8586" : "",
                  }}
                  onClick={() => handleMethodChange(1)}
                >
                  <Icon name="fire" />
                  Trade
                </Dropdown.Item>
                <Dropdown.Item>
                  <WalletConnectButton />
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }

  return (
    <div
      style={{
        paddingTop: "1%",
        paddingBottom: "1%",
        paddingLeft: "6%",
        paddingRight: "6%",
      }}
    >
      {layout}
    </div>
  );
}

export default Header;
